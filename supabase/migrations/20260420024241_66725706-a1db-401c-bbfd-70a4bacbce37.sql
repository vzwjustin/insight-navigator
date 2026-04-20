-- Replace permissive policies with explicit auth.uid() checks
-- Same shared-workspace model, but linter-clean

-- intake_responses
DROP POLICY IF EXISTS "Authenticated all intake_responses" ON public.intake_responses;
CREATE POLICY "Auth select intake" ON public.intake_responses FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert intake" ON public.intake_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update intake" ON public.intake_responses FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete intake" ON public.intake_responses FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- transcripts
DROP POLICY IF EXISTS "Authenticated all transcripts" ON public.transcripts;
CREATE POLICY "Auth select transcripts" ON public.transcripts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert transcripts" ON public.transcripts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update transcripts" ON public.transcripts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete transcripts" ON public.transcripts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pain_points
DROP POLICY IF EXISTS "Authenticated all pain_points" ON public.pain_points;
CREATE POLICY "Auth select painpoints" ON public.pain_points FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert painpoints" ON public.pain_points FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update painpoints" ON public.pain_points FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete painpoints" ON public.pain_points FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- recommendations
DROP POLICY IF EXISTS "Authenticated all recommendations" ON public.recommendations;
CREATE POLICY "Auth select recs" ON public.recommendations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert recs" ON public.recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update recs" ON public.recommendations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete recs" ON public.recommendations FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- upsell_opportunities
DROP POLICY IF EXISTS "Authenticated all upsell_opportunities" ON public.upsell_opportunities;
CREATE POLICY "Auth select upsell" ON public.upsell_opportunities FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert upsell" ON public.upsell_opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update upsell" ON public.upsell_opportunities FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete upsell" ON public.upsell_opportunities FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ai_runs
DROP POLICY IF EXISTS "Authenticated all ai_runs" ON public.ai_runs;
CREATE POLICY "Auth select ai_runs" ON public.ai_runs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert ai_runs" ON public.ai_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update ai_runs" ON public.ai_runs FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- assessments: tighten the UPDATE policy that used USING (true)
DROP POLICY IF EXISTS "Authenticated update assessments" ON public.assessments;
CREATE POLICY "Auth update assessments" ON public.assessments FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);