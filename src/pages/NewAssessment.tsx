import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { INDUSTRY_TEMPLATES, getTemplate, isHealthcare, IndustryKey } from "@/lib/templates";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, ShieldAlert } from "lucide-react";

type Step = 0 | 1 | 2 | 3;

const NewAssessment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState<IndustryKey>("local_service");
  const [employeeCount, setEmployeeCount] = useState("");
  const [locations, setLocations] = useState("");
  const [currentTools, setCurrentTools] = useState("");
  const [intake, setIntake] = useState<Record<string, string>>({});
  const [transcript, setTranscript] = useState("");

  useEffect(() => { document.title = "New assessment · Assessment Copilot"; }, []);

  const template = getTemplate(industry);

  const next = () => setStep(s => Math.min(3, (s + 1) as Step));
  const prev = () => setStep(s => Math.max(0, (s - 1) as Step));

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Create assessment
      const { data: assessment, error } = await supabase
        .from("assessments")
        .insert({
          created_by: user.id,
          client_name: clientName,
          industry,
          employee_count: employeeCount ? parseInt(employeeCount) : null,
          locations: locations ? parseInt(locations) : null,
          current_tools: currentTools || null,
          status: "analyzing",
        })
        .select()
        .single();
      if (error) throw error;

      // 2. Save intake responses
      const intakeRows = template.questions
        .filter(q => intake[q.key]?.trim())
        .map(q => ({
          assessment_id: assessment.id,
          question_key: q.key,
          question_label: q.label,
          answer: intake[q.key],
        }));
      if (intakeRows.length) {
        const { error: ie } = await supabase.from("intake_responses").insert(intakeRows);
        if (ie) throw ie;
      }

      // 3. Save transcript (if any)
      if (transcript.trim()) {
        const { error: te } = await supabase.from("transcripts").insert({
          assessment_id: assessment.id,
          source: "paste",
          content: transcript,
        });
        if (te) throw te;
      }

      // 4. Trigger AI analysis (fire and forget; detail page will poll)
      supabase.functions.invoke("analyze-assessment", {
        body: { assessment_id: assessment.id },
      }).catch(err => console.error("analysis kickoff", err));

      toast.success("Assessment created. Analysis running…");
      navigate(`/assessments/${assessment.id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create assessment");
      setSaving(false);
    }
  };

  const canNext =
    (step === 0 && clientName.trim()) ||
    (step === 1) ||
    (step === 2) ||
    step === 3;

  const stepLabels = ["Client profile", "Intake", "Transcript", "Review & run"];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">New assessment</h1>
        <p className="text-muted-foreground mt-1">Capture context, run AI analysis, generate a report.</p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-8 text-sm">
        {stepLabels.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`size-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-success text-success-foreground" :
                "bg-muted text-muted-foreground"
              }`}
            >{i + 1}</span>
            <span className={i === step ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {i < stepLabels.length - 1 && <span className="text-muted-foreground/40 mx-1">→</span>}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="p-6 space-y-5">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="client">Client / business name *</Label>
                <Input id="client" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Plumbing" />
              </div>

              <div className="space-y-1.5">
                <Label>Industry template</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INDUSTRY_TEMPLATES.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setIndustry(t.key)}
                      className={`text-left p-3 rounded-md border transition-colors ${
                        industry === t.key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                    </button>
                  ))}
                </div>
                {isHealthcare(industry) && (
                  <div className="mt-3 p-3 rounded-md border border-warning/30 bg-warning/5 text-sm flex gap-2">
                    <ShieldAlert className="size-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <strong>Healthcare mode:</strong> use de-identified data only. Avoid uploading PHI.
                      Treat outputs as operational guidance, not medical advice.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="emp">Employee count</Label>
                  <Input id="emp" type="number" value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc">Locations</Label>
                  <Input id="loc" type="number" value={locations} onChange={e => setLocations(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tools">Current software stack</Label>
                <Textarea id="tools" rows={2} value={currentTools} onChange={e => setCurrentTools(e.target.value)}
                  placeholder="e.g. Square POS, Google Calendar, Mailchimp, manual spreadsheets" />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Answer what you know. Skip what you don't — the AI will use whatever context you provide.
              </p>
              {template.questions.map(q => (
                <div key={q.key} className="space-y-1.5">
                  <Label htmlFor={q.key}>
                    {q.label}{q.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
                  <Textarea
                    id={q.key}
                    rows={3}
                    value={intake[q.key] ?? ""}
                    onChange={e => setIntake(v => ({ ...v, [q.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="transcript">Transcript or interview notes</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste the discovery call transcript, Zoom auto-summary, or your raw notes.
                  Speaker labels are fine ("Owner:", "Me:") — the AI will handle them.
                </p>
              </div>
              <Textarea
                id="transcript"
                rows={16}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste transcript here…"
                className="font-mono text-sm"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <ReviewRow label="Client" value={clientName || "—"} />
              <ReviewRow label="Industry" value={template.label} />
              <ReviewRow label="Size" value={`${employeeCount || "?"} employees · ${locations || "?"} locations`} />
              <ReviewRow label="Intake answers" value={`${Object.values(intake).filter(v => v?.trim()).length} of ${template.questions.length}`} />
              <ReviewRow label="Transcript" value={transcript ? `${transcript.length.toLocaleString()} characters` : "Not provided"} />

              <div className="p-4 rounded-md bg-muted/50 text-sm">
                Clicking <strong>Run analysis</strong> will save the assessment and start the AI pipeline:
                fact extraction → pain point identification → classification → scoring → recommendations → upsells.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="ghost" onClick={prev} disabled={step === 0 || saving}>
              <ArrowLeft className="size-4 mr-2" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={next} disabled={!canNext}>
                Next <ArrowRight className="size-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={saving || !clientName.trim()}>
                {saving ? <><Loader2 className="size-4 animate-spin mr-2" /> Starting…</> : "Run analysis"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-sm font-medium text-right max-w-md">{value}</div>
  </div>
);

export default NewAssessment;
