-- ============================================
-- AI Business Assessment Copilot - Schema
-- Single shared workspace; all authenticated users collaborate
-- ============================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Assessments
-- ============================================
CREATE TYPE public.assessment_status AS ENUM ('draft','intake','transcript','analyzing','review','complete');
CREATE TYPE public.industry_template AS ENUM ('retail','local_service','medical','dental_medspa','salon_barber','real_estate','home_services','other');

CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  industry public.industry_template NOT NULL DEFAULT 'other',
  employee_count INT,
  locations INT,
  current_tools TEXT,
  status public.assessment_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view all assessments" ON public.assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create assessments" ON public.assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated update assessments" ON public.assessments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete assessments" ON public.assessments FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER assessments_updated_at BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_assessments_created_by ON public.assessments(created_by);

-- ============================================
-- Intake responses (key-value store of structured intake answers)
-- ============================================
CREATE TABLE public.intake_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_label TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, question_key)
);
ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all intake_responses" ON public.intake_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER intake_responses_updated_at BEFORE UPDATE ON public.intake_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_intake_assessment ON public.intake_responses(assessment_id);

-- ============================================
-- Transcripts (single text blob per assessment for MVP, but allow multiple sources)
-- ============================================
CREATE TYPE public.transcript_source AS ENUM ('paste','notes','zoom','voice_ai','other');

CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  source public.transcript_source NOT NULL DEFAULT 'paste',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all transcripts" ON public.transcripts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_transcripts_assessment ON public.transcripts(assessment_id);

-- ============================================
-- Pain points
-- ============================================
CREATE TYPE public.pain_category AS ENUM ('process','people','tool','strategy');

CREATE TABLE public.pain_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  evidence TEXT,
  categories public.pain_category[] NOT NULL DEFAULT '{}',
  root_cause TEXT,
  severity INT NOT NULL DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
  frequency INT NOT NULL DEFAULT 3 CHECK (frequency BETWEEN 1 AND 5),
  confidence INT NOT NULL DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  revenue_impact INT NOT NULL DEFAULT 3 CHECK (revenue_impact BETWEEN 1 AND 5),
  time_waste INT NOT NULL DEFAULT 3 CHECK (time_waste BETWEEN 1 AND 5),
  friction INT NOT NULL DEFAULT 3 CHECK (friction BETWEEN 1 AND 5),
  ease_of_fix INT NOT NULL DEFAULT 3 CHECK (ease_of_fix BETWEEN 1 AND 5),
  priority NUMERIC GENERATED ALWAYS AS (
    ((severity + frequency + revenue_impact + time_waste + friction)::numeric * confidence) /
    GREATEST(ease_of_fix, 1)
  ) STORED,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pain_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all pain_points" ON public.pain_points FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER pain_points_updated_at BEFORE UPDATE ON public.pain_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_painpoints_assessment ON public.pain_points(assessment_id);
CREATE INDEX idx_painpoints_priority ON public.pain_points(assessment_id, priority DESC);

-- ============================================
-- Recommendations
-- ============================================
CREATE TYPE public.recommendation_type AS ENUM ('process','training','tool','phased');

CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  pain_point_id UUID REFERENCES public.pain_points(id) ON DELETE CASCADE,
  recommendation_type public.recommendation_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  effort_level TEXT,
  estimated_impact TEXT,
  tool_name TEXT,
  tool_category TEXT,
  confidence INT DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all recommendations" ON public.recommendations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER recommendations_updated_at BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_recommendations_assessment ON public.recommendations(assessment_id);
CREATE INDEX idx_recommendations_painpoint ON public.recommendations(pain_point_id);

-- ============================================
-- Upsell opportunities
-- ============================================
CREATE TABLE public.upsell_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  offer_name TEXT NOT NULL,
  why_it_fits TEXT NOT NULL,
  linked_pain_point_titles TEXT[] DEFAULT '{}',
  suggested_price_range TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.upsell_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all upsell_opportunities" ON public.upsell_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER upsell_updated_at BEFORE UPDATE ON public.upsell_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_upsell_assessment ON public.upsell_opportunities(assessment_id);

-- ============================================
-- AI runs (audit log)
-- ============================================
CREATE TABLE public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all ai_runs" ON public.ai_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_ai_runs_assessment ON public.ai_runs(assessment_id);
