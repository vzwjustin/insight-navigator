import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Assessment = {
  id: string;
  client_name: string;
  industry: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft:       { label: "Draft",      className: "bg-muted text-muted-foreground" },
  intake:      { label: "Intake",     className: "bg-info/10 text-info" },
  transcript:  { label: "Transcript", className: "bg-info/10 text-info" },
  analyzing:   { label: "Analyzing",  className: "bg-warning/10 text-warning" },
  review:      { label: "Review",     className: "bg-category-strategy/10 text-category-strategy" },
  complete:    { label: "Complete",   className: "bg-success/10 text-success" },
};

const Index = () => {
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard · Assessment Copilot";
    (async () => {
      const { data, error } = await supabase
        .from("assessments")
        .select("id,client_name,industry,status,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (!error && data) setItems(data as Assessment[]);
      setLoading(false);
    })();
  }, []);

  const counts = {
    total: items.length,
    active: items.filter(i => !["complete"].includes(i.status)).length,
    complete: items.filter(i => i.status === "complete").length,
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Assessments</h1>
          <p className="text-muted-foreground mt-1">Operator dashboard. Run discovery, validate pain points, ship reports.</p>
        </div>
        <Button asChild>
          <Link to="/assessments/new"><Plus className="size-4 mr-2" /> New assessment</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Stat title="Total assessments" value={counts.total} icon={FileText} />
        <Stat title="In progress" value={counts.active} icon={Clock} />
        <Stat title="Completed" value={counts.complete} icon={CheckCircle2} />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-medium">Recent assessments</h2>
        </div>
        {loading ? (
          <div className="p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin mr-2" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground mb-4">No assessments yet.</p>
            <Button asChild><Link to="/assessments/new"><Plus className="size-4 mr-2" /> Start your first one</Link></Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map(a => {
              const s = STATUS_LABEL[a.status] ?? STATUS_LABEL.draft;
              return (
                <Link
                  key={a.id}
                  to={`/assessments/${a.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.client_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {a.industry.replace(/_/g, " ")} · updated {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  <span className={`pill ${s.className}`}>{s.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const Stat = ({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
  <div className="stat-tile">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{title}</span>
      <Icon className="size-4 text-muted-foreground" />
    </div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

export default Index;
