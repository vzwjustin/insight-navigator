import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { CATEGORY_META, RECO_TYPE_META, Category } from "@/lib/categories";

type Data = {
  assessment: any;
  pains: any[];
  recs: any[];
  upsells: any[];
  intake: any[];
};

const Report = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => { document.title = "Report · Assessment Copilot"; }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [a, p, r, u, i] = await Promise.all([
        supabase.from("assessments").select("*").eq("id", id).single(),
        supabase.from("pain_points").select("*").eq("assessment_id", id).order("priority", { ascending: false }),
        supabase.from("recommendations").select("*").eq("assessment_id", id).order("position"),
        supabase.from("upsell_opportunities").select("*").eq("assessment_id", id),
        supabase.from("intake_responses").select("*").eq("assessment_id", id),
      ]);
      setData({
        assessment: a.data,
        pains: p.data ?? [],
        recs: r.data ?? [],
        upsells: u.data ?? [],
        intake: i.data ?? [],
      });
    })();
  }, [id]);

  if (!data?.assessment) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground"><Loader2 className="size-4 animate-spin mr-2" />Loading…</div>;
  }

  const { assessment: a, pains, recs, upsells, intake } = data;
  const top = pains.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/assessments/${id}`}><ArrowLeft className="size-4 mr-2" /> Back</Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4 mr-2" /> Print / Save PDF
          </Button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 lg:px-10 py-12 space-y-10">
        {/* Cover */}
        <header className="border-b border-border pb-8">
          <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Operations Assessment</div>
          <h1 className="text-4xl font-semibold mb-2">{a.client_name}</h1>
          <p className="text-muted-foreground capitalize">
            {String(a.industry).replace(/_/g, " ")}
            {a.employee_count ? ` · ${a.employee_count} employees` : ""}
            {a.locations ? ` · ${a.locations} locations` : ""}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Prepared {new Date(a.created_at).toLocaleDateString()}
          </p>
        </header>

        {/* Executive summary */}
        <Section title="Executive summary">
          <p>
            We reviewed your operation across intake, scheduling, follow-up, reporting, and customer
            handling. We identified <strong>{pains.length} pain points</strong> driving wasted time and
            lost revenue. The top {top.length} are highest-priority: each is causing measurable friction
            and is fixable with practical changes — most without buying new software.
          </p>
          {a.current_tools && (
            <p className="mt-3"><strong>Current stack we noted:</strong> {a.current_tools}</p>
          )}
        </Section>

        {/* What we heard */}
        {intake.length > 0 && (
          <Section title="What we heard">
            <dl className="space-y-3">
              {intake.filter((q: any) => q.answer?.trim()).slice(0, 8).map((q: any) => (
                <div key={q.id}>
                  <dt className="text-sm font-medium">{q.question_label}</dt>
                  <dd className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{q.answer}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {/* Top pain points */}
        <Section title={`Top ${top.length} pain points`}>
          <div className="space-y-5">
            {top.map((p: any, i: number) => (
              <div key={p.id} className="border-l-4 border-primary pl-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                  {(p.categories as Category[]).map(c => (
                    <span key={c} className={`pill border ${CATEGORY_META[c]?.color}`}>{CATEGORY_META[c]?.label}</span>
                  ))}
                  <span className="pill bg-muted text-muted-foreground">Priority {Math.round(Number(p.priority))}</span>
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                {p.evidence && <p className="text-sm italic text-muted-foreground mt-1">"{p.evidence}"</p>}
                {p.root_cause && <p className="text-sm mt-2"><strong>Likely root cause:</strong> {p.root_cause}</p>}
              </div>
            ))}
          </div>
        </Section>

        {/* Recommendations grouped by type */}
        {(["process", "training", "tool", "phased"] as const).map(type => {
          const list = recs.filter(r => r.recommendation_type === type);
          if (!list.length) return null;
          const meta = RECO_TYPE_META[type];
          return (
            <Section key={type} title={`Recommendations · ${meta.label}`}>
              <div className="space-y-3">
                {list.map((r: any) => (
                  <div key={r.id} className="surface-card p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {r.effort_level && <span className="pill bg-muted text-muted-foreground">Effort: {r.effort_level}</span>}
                      {r.estimated_impact && <span className="pill bg-muted text-muted-foreground">Impact: {r.estimated_impact}</span>}
                      {r.tool_name && <span className="pill bg-category-tool/10 text-category-tool">{r.tool_name}</span>}
                    </div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                    {r.rationale && <p className="text-xs italic text-muted-foreground mt-1">Why: {r.rationale}</p>}
                  </div>
                ))}
              </div>
            </Section>
          );
        })}

        {/* Upsells */}
        {upsells.length > 0 && (
          <Section title="Suggested next implementation projects">
            <div className="space-y-3">
              {upsells.map((u: any) => (
                <div key={u.id} className="surface-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold">{u.offer_name}</h3>
                    {u.suggested_price_range && (
                      <span className="pill bg-success/10 text-success">{u.suggested_price_range}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{u.why_it_fits}</p>
                  {u.scope && <p className="text-sm mt-1"><strong>Scope:</strong> {u.scope}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        <footer className="text-xs text-muted-foreground border-t border-border pt-6">
          This report combines your interview answers and AI analysis. Findings are grounded in the
          evidence provided. Items marked as <em>likely root cause</em> are inferred and should be
          validated with the client before major investments.
        </footer>
      </article>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">{title}</h2>
    <div className="prose-sm space-y-3">{children}</div>
  </section>
);

export default Report;
