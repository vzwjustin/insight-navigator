// Analyze assessment: staged AI pipeline.
// Stages: extract pain points → classify + score → recommend → upsells.
// Uses Lovable AI Gateway with tool-calling for structured output.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `You are an experienced operations consultant analyzing a business owner's discovery interview and intake answers.

CORE RULES:
- Distinguish observed facts from inferred root causes. Mark inferences as "likely".
- Never recommend software just because it exists. Always include a no-software fix where possible.
- Tie every recommendation to specific evidence from the inputs.
- If evidence is weak, lower the confidence score and say so.
- Classify each pain point into one or more of: process, people, tool, strategy.
- Use plain English. Avoid AI buzzwords. No flattery, no fluff.
- Severity/frequency/impact/etc. are 1-5 scales (1 = low, 5 = severe).`;

async function callAI(messages: any[], tools: any[], toolChoice: any, apiKey: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools,
      tool_choice: toolChoice,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${txt}`);
  }
  const json = await resp.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("No tool call returned");
  return JSON.parse(call.function.arguments);
}

const ANALYSIS_TOOL = {
  type: "function",
  function: {
    name: "submit_assessment_analysis",
    description: "Submit the full structured analysis of the business assessment.",
    parameters: {
      type: "object",
      properties: {
        pain_points: {
          type: "array",
          description: "Identified pain points, ranked roughly by impact.",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short label (5-10 words)." },
              description: { type: "string", description: "1-2 sentences explaining the issue clearly." },
              evidence: { type: "string", description: "Direct quote or paraphrase from the inputs supporting this." },
              categories: {
                type: "array",
                items: { type: "string", enum: ["process", "people", "tool", "strategy"] },
                description: "One or more buckets this fits into.",
              },
              root_cause: { type: "string", description: "Inferred likely root cause. Prefix with 'Likely:'." },
              severity: { type: "integer", minimum: 1, maximum: 5 },
              frequency: { type: "integer", minimum: 1, maximum: 5 },
              confidence: { type: "integer", minimum: 1, maximum: 5, description: "How strong is the evidence (not how confident we are it's bad)." },
              revenue_impact: { type: "integer", minimum: 1, maximum: 5 },
              time_waste: { type: "integer", minimum: 1, maximum: 5 },
              friction: { type: "integer", minimum: 1, maximum: 5 },
              ease_of_fix: { type: "integer", minimum: 1, maximum: 5, description: "1=very hard, 5=very easy." },
              recommendations: {
                type: "array",
                description: "1-3 concrete recommendations for THIS pain point. Always include at least one no-software fix when possible.",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["process", "training", "tool", "phased"] },
                    title: { type: "string", description: "Short action label." },
                    description: { type: "string", description: "What to do, in plain English." },
                    rationale: { type: "string", description: "Why this fits THIS specific pain point." },
                    effort_level: { type: "string", enum: ["low", "medium", "high"] },
                    estimated_impact: { type: "string", enum: ["low", "medium", "high"] },
                    tool_name: { type: "string", description: "Optional. Only if recommendation type is tool." },
                    tool_category: { type: "string", description: "Optional. e.g. CRM, scheduler, missed-call text-back." },
                    confidence: { type: "integer", minimum: 1, maximum: 5 },
                  },
                  required: ["type", "title", "description", "rationale", "effort_level", "estimated_impact", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "description", "evidence", "categories", "root_cause",
              "severity", "frequency", "confidence", "revenue_impact", "time_waste",
              "friction", "ease_of_fix", "recommendations"],
            additionalProperties: false,
          },
        },
        upsell_opportunities: {
          type: "array",
          description: "Likely paid follow-on implementation projects tied to specific pain points.",
          items: {
            type: "object",
            properties: {
              offer_name: { type: "string" },
              why_it_fits: { type: "string", description: "Tie to specific pain points and evidence." },
              linked_pain_point_titles: { type: "array", items: { type: "string" } },
              suggested_price_range: { type: "string", description: "e.g. $1.5k-$3k or $5k+" },
              scope: { type: "string", description: "1-2 sentences on what's included." },
            },
            required: ["offer_name", "why_it_fits", "linked_pain_point_titles", "scope"],
            additionalProperties: false,
          },
        },
      },
      required: ["pain_points", "upsell_opportunities"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  let assessmentId: string | undefined;
  try {
    const body = await req.json();
    assessmentId = body.assessment_id;
    if (!assessmentId) throw new Error("assessment_id required");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Mark as analyzing + create run row
    await supabase.from("assessments").update({ status: "analyzing" }).eq("id", assessmentId);
    const { data: run } = await supabase.from("ai_runs").insert({
      assessment_id: assessmentId, stage: "full_pipeline", model: MODEL, status: "running",
    }).select().single();

    // Load context
    const [{ data: a }, { data: intake }, { data: transcripts }] = await Promise.all([
      supabase.from("assessments").select("*").eq("id", assessmentId).single(),
      supabase.from("intake_responses").select("*").eq("assessment_id", assessmentId),
      supabase.from("transcripts").select("*").eq("assessment_id", assessmentId),
    ]);
    if (!a) throw new Error("Assessment not found");

    // Build user message
    const intakeText = (intake ?? [])
      .filter((i: any) => i.answer?.trim())
      .map((i: any) => `Q: ${i.question_label}\nA: ${i.answer}`)
      .join("\n\n");
    const transcriptText = (transcripts ?? []).map((t: any) => t.content).join("\n\n--- next source ---\n\n");

    const userMessage = `# Business profile
- Client: ${a.client_name}
- Industry: ${a.industry}
- Employees: ${a.employee_count ?? "unknown"}
- Locations: ${a.locations ?? "unknown"}
- Current tools: ${a.current_tools ?? "not stated"}

# Intake answers
${intakeText || "(none provided)"}

# Interview transcript / notes
${transcriptText || "(none provided)"}

---
Analyze the above. Extract the most important pain points (aim for 4-8). Score each. Provide grounded recommendations and likely upsell opportunities.`;

    // Single call with structured tool output (Stage A-F bundled)
    const result = await callAI(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      [ANALYSIS_TOOL],
      { type: "function", function: { name: "submit_assessment_analysis" } },
      apiKey,
    );

    // Persist pain points + their recommendations
    const painPoints = result.pain_points ?? [];
    for (const [idx, pp] of painPoints.entries()) {
      const { data: inserted, error: ppErr } = await supabase.from("pain_points").insert({
        assessment_id: assessmentId,
        title: pp.title,
        description: pp.description,
        evidence: pp.evidence,
        categories: pp.categories,
        root_cause: pp.root_cause,
        severity: pp.severity,
        frequency: pp.frequency,
        confidence: pp.confidence,
        revenue_impact: pp.revenue_impact,
        time_waste: pp.time_waste,
        friction: pp.friction,
        ease_of_fix: pp.ease_of_fix,
        position: idx,
      }).select().single();
      if (ppErr) { console.error("pp insert", ppErr); continue; }

      const recs = (pp.recommendations ?? []).map((r: any, i: number) => ({
        assessment_id: assessmentId,
        pain_point_id: inserted.id,
        recommendation_type: r.type,
        title: r.title,
        description: r.description,
        rationale: r.rationale,
        effort_level: r.effort_level,
        estimated_impact: r.estimated_impact,
        tool_name: r.tool_name ?? null,
        tool_category: r.tool_category ?? null,
        confidence: r.confidence,
        position: i,
      }));
      if (recs.length) {
        const { error: rErr } = await supabase.from("recommendations").insert(recs);
        if (rErr) console.error("recs insert", rErr);
      }
    }

    // Upsells
    const upsells = (result.upsell_opportunities ?? []).map((u: any) => ({
      assessment_id: assessmentId,
      offer_name: u.offer_name,
      why_it_fits: u.why_it_fits,
      linked_pain_point_titles: u.linked_pain_point_titles ?? [],
      suggested_price_range: u.suggested_price_range ?? null,
      scope: u.scope ?? null,
    }));
    if (upsells.length) {
      const { error: uErr } = await supabase.from("upsell_opportunities").insert(upsells);
      if (uErr) console.error("upsells insert", uErr);
    }

    await supabase.from("assessments").update({ status: "review" }).eq("id", assessmentId);
    if (run) await supabase.from("ai_runs").update({
      status: "complete", completed_at: new Date().toISOString(),
    }).eq("id", run.id);

    return new Response(JSON.stringify({ ok: true, pain_points: painPoints.length, upsells: upsells.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("analyze-assessment error:", err);
    if (assessmentId) {
      await supabase.from("assessments").update({ status: "draft" }).eq("id", assessmentId);
      await supabase.from("ai_runs").insert({
        assessment_id: assessmentId, stage: "full_pipeline", model: MODEL,
        status: "failed", error: String(err?.message ?? err),
      });
    }
    const status = String(err?.message ?? "").includes("429") ? 429
                 : String(err?.message ?? "").includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
