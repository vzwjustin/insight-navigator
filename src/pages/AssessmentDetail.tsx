import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { CATEGORY_META, RECO_TYPE_META, Category } from "@/lib/categories";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FileText, RefreshCw, Trash2, AlertCircle } from "lucide-react";

type Assessment = {
  id: string; client_name: string; industry: string; status: string;
  employee_count: number | null; locations: number | null; current_tools: string | null;
};

type PainPoint = {
  id: string; title: string; description: string | null; evidence: string | null;
  categories: Category[]; root_cause: string | null;
  severity: number; frequency: number; confidence: number;
  revenue_impact: number; time_waste: number; friction: number; ease_of_fix: number;
  priority: number;
};

type Recommendation = {
  id: string; pain_point_id: string | null; recommendation_type: string;
  title: string; description: string; rationale: string | null;
  effort_level: string | null; estimated_impact: string | null;
  tool_name: string | null; tool_category: string | null; confidence: number | null;
};

type Upsell = {
  id: string; offer_name: string; why_it_fits: string;
  linked_pain_point_titles: string[]; suggested_price_range: string | null; scope: string | null;
};

const SCORE_FIELDS: { key: keyof PainPoint; label: string }[] = [
  { key: "severity", label: "Severity" },
  { key: "frequency", label: "Frequency" },
  { key: "confidence", label: "Confidence" },
  { key: "revenue_impact", label: "Revenue impact" },
  { key: "time_waste", label: "Time waste" },
  { key: "friction", label: "Friction" },
  { key: "ease_of_fix", label: "Ease of fix" },
];

const AssessmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [a, setA] = useState<Assessment | null>(null);
  const [pains, setPains] = useState<PainPoint[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [aRes, pRes, rRes, uRes] = await Promise.all([
      supabase.from("assessments").select("*").eq("id", id).single(),
      supabase.from("pain_points").select("*").eq("assessment_id", id).order("priority", { ascending: false }),
      supabase.from("recommendations").select("*").eq("assessment_id", id).order("position"),
      supabase.from("upsell_opportunities").select("*").eq("assessment_id", id),
    ]);
    if (aRes.data) setA(aRes.data as Assessment);
    if (pRes.data) setPains(pRes.data as PainPoint[]);
    if (rRes.data) setRecs(rRes.data as Recommendation[]);
    if (uRes.data) setUpsells(uRes.data as Upsell[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { document.title = "Assessment · Copilot"; load(); }, [load]);

  // Poll while analyzing
  useEffect(() => {
    if (a?.status !== "analyzing") return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [a?.status, load]);

  const updateScore = async (pp: PainPoint, key: keyof PainPoint, value: number) => {
    setPains(prev => prev.map(p => p.id === pp.id ? { ...p, [key]: value } : p));
    const { error } = await supabase.from("pain_points").update({ [key]: value }).eq("id", pp.id);
    if (error) toast.error("Failed to save");
    else load();
  };

  const reanalyze = async () => {
    if (!id) return;
    setReanalyzing(true);
    await supabase.from("assessments").update({ status: "analyzing" }).eq("id", id);
    await Promise.all([
      supabase.from("pain_points").delete().eq("assessment_id", id),
      supabase.from("recommendations").delete().eq("assessment_id", id),
      supabase.from("upsell_opportunities").delete().eq("assessment_id", id),
    ]);
    await supabase.functions.invoke("analyze-assessment", { body: { assessment_id: id } });
    setReanalyzing(false);
    load();
  };

  const deleteAssessment = async () => {
    if (!id || !confirm("Delete this assessment? This cannot be undone.")) return;
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); navigate("/"); }
  };

  if (loading) return <AppLayout><div className="flex items-center text-muted-foreground"><Loader2 className="size-4 animate-spin mr-2" />Loading…</div></AppLayout>;
  if (!a) return <AppLayout><div>Not found.</div></AppLayout>;

  const isAnalyzing = a.status === "analyzing";
  const isFailed = a.status === "draft" && pains.length === 0;

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/"><ArrowLeft className="size-4 mr-2" /> Dashboard</Link>
      </Button>

      <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{a.client_name}</h1>
          <p className="text-muted-foreground capitalize">
            {a.industry.replace(/_/g, " ")}
            {a.employee_count ? ` · ${a.employee_count} employees` : ""}
            {a.locations ? ` · ${a.locations} locations` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {!isAnalyzing && pains.length > 0 && (
            <Button variant="outline" asChild>
              <Link to={`/assessments/${id}/report`}><FileText className="size-4 mr-2" /> View report</Link>
            </Button>
          )}
          <Button variant="outline" onClick={reanalyze} disabled={reanalyzing || isAnalyzing}>
            <RefreshCw className={`size-4 mr-2 ${reanalyzing ? "animate-spin" : ""}`} /> Re-analyze
          </Button>
          <Button variant="ghost" size="icon" onClick={deleteAssessment}><Trash2 className="size-4" /></Button>
        </div>
      </div>

      {isAnalyzing && (
        <div className="mb-6 p-4 rounded-md border border-info/30 bg-info/5 flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-info" />
          <div>
            <div className="font-medium">Analysis in progress</div>
            <div className="text-sm text-muted-foreground">Extracting pain points, classifying, scoring, generating recommendations…</div>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="mb-6 p-4 rounded-md border border-destructive/30 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="size-5 text-destructive shrink-0" />
          <div>
            <div className="font-medium">Analysis failed or hasn't run.</div>
            <div className="text-sm text-muted-foreground">Click Re-analyze to retry.</div>
          </div>
        </div>
      )}

      {/* Pain points */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Pain points <span className="text-muted-foreground font-normal text-base">({pains.length})</span></h2>
        {pains.length === 0 && !isAnalyzing && <p className="text-muted-foreground">No pain points yet.</p>}
        <div className="space-y-3">
          {pains.map(p => (
            <Card key={p.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {p.categories.map(c => (
                        <span key={c} className={`pill border ${CATEGORY_META[c]?.color}`}>{CATEGORY_META[c]?.label ?? c}</span>
                      ))}
                    </div>
                    <h3 className="font-semibold">{p.title}</h3>
                    {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Priority</div>
                    <div className="text-2xl font-semibold tabular-nums">{Math.round(Number(p.priority))}</div>
                  </div>
                </div>

                {p.evidence && (
                  <div className="text-sm border-l-2 border-border pl-3 italic text-muted-foreground">
                    "{p.evidence}"
                  </div>
                )}

                {p.root_cause && (
                  <div className="text-sm">
                    <span className="font-medium">Likely root cause: </span>
                    <span className="text-muted-foreground">{p.root_cause}</span>
                  </div>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Edit scores</summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {SCORE_FIELDS.map(f => (
                      <div key={f.key as string}>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{f.label}</span>
                          <span className="font-medium">{p[f.key] as number}</span>
                        </div>
                        <Slider
                          min={1} max={5} step={1}
                          value={[p[f.key] as number]}
                          onValueChange={([v]) => updateScore(p, f.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </details>

                {/* Linked recommendations */}
                {(() => {
                  const linked = recs.filter(r => r.pain_point_id === p.id);
                  if (!linked.length) return null;
                  return (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommendations</div>
                      {linked.map(r => (
                        <RecCard key={r.id} r={r} />
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Upsells */}
      {upsells.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Upsell opportunities</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {upsells.map(u => (
              <Card key={u.id}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{u.offer_name}</h3>
                    {u.suggested_price_range && (
                      <span className="pill bg-success/10 text-success">{u.suggested_price_range}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{u.why_it_fits}</p>
                  {u.scope && <p className="text-sm"><span className="font-medium">Scope: </span>{u.scope}</p>}
                  {u.linked_pain_point_titles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {u.linked_pain_point_titles.map((t, i) => (
                        <span key={i} className="pill bg-muted text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </AppLayout>
  );
};

const RecCard = ({ r }: { r: Recommendation }) => {
  const meta = RECO_TYPE_META[r.recommendation_type as keyof typeof RECO_TYPE_META];
  return (
    <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {meta && <span className={`pill ${meta.color}`}>{meta.label}</span>}
        {r.effort_level && <span className="pill bg-muted text-muted-foreground">Effort: {r.effort_level}</span>}
        {r.estimated_impact && <span className="pill bg-muted text-muted-foreground">Impact: {r.estimated_impact}</span>}
        {r.tool_name && <span className="pill bg-category-tool/10 text-category-tool">{r.tool_name}</span>}
      </div>
      <div className="font-medium text-sm">{r.title}</div>
      <p className="text-sm text-muted-foreground">{r.description}</p>
      {r.rationale && (
        <p className="text-xs text-muted-foreground italic">Why: {r.rationale}</p>
      )}
    </div>
  );
};

export default AssessmentDetail;
