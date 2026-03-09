import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bot, Zap, TrendingUp, Activity, ChevronRight, Sparkles, Database, Bell, Webhook, Plus, Brain, Share2, Loader2, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeAgents } from "@/hooks/useRealtimeAgents";
import { useEnterprisePartnerOnboarding } from "@/hooks/useEnterprisePartnerOnboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DemoWizard from "@/components/dashboard/DemoWizard";
import { EnterprisePartnerOverview } from "@/components/dashboard/EnterprisePartnerOverview";

const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedingPL, setSeedingPL] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentDomain, setAgentDomain] = useState("");
  const [agentDesc, setAgentDesc] = useState("");
  const [creating, setCreating] = useState(false);
  useRealtimeAgents();
  const { onboarding, handoff, isEnterprisePartner } = useEnterprisePartnerOnboarding();

  const { data: agents = [], refetch: refetchAgents } = useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentEvents = [] } = useQuery({
    queryKey: ["recent-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: teamsCount = 0 } = useQuery({
    queryKey: ["owned-team-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalLearnings = agents.reduce((sum, a) => sum + a.shared_learnings, 0);
  const avgPerformance = agents.length
    ? (agents.reduce((sum, a) => sum + (a.performance_score ?? 0), 0) / agents.length).toFixed(1)
    : "0";

  const stats = [
    { label: "Total Agents", value: agents.length, icon: Bot, accent: false },
    { label: "Active", value: activeCount, icon: Activity, accent: true },
    { label: "Shared Learnings", value: totalLearnings.toLocaleString(), icon: Zap, accent: false },
    { label: "Avg Performance", value: `${avgPerformance}%`, icon: TrendingUp, accent: false },
  ];

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook`;

  const handleCreateAgent = async () => {
    if (!agentName.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("agents").insert([{
        name: agentName,
        description: agentDesc || null,
        domain: agentDomain || null,
        user_id: user!.id,
      }]);
      if (error) throw error;
      toast.success("Agent created!");
      setCreateOpen(false);
      setAgentName("");
      setAgentDomain("");
      setAgentDesc("");
      refetchAgents();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your collective intelligence overview</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /><span className="hidden sm:inline">New Agent</span><span className="sm:hidden">Agent</span></Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Agent</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateAgent(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="My Agent" required />
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input value={agentDomain} onChange={(e) => setAgentDomain(e.target.value)} placeholder="e.g. Customer Support" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} placeholder="What does this agent do?" rows={3} />
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Agent"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" disabled={seeding} onClick={async () => {
            setSeeding(true);
            try {
              const { data, error } = await supabase.functions.invoke("analyze-intelligence", { body: { action: "seed_demo" } });
              if (error) throw error;
              toast.success(`Seeded ${data.seeded?.agents} agents, ${data.seeded?.decision_templates} templates, and feedback data`);
              refetchAgents();
            } catch (e: any) { toast.error(e.message || "Failed to seed"); } finally { setSeeding(false); }
          }}>
            <Database className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">{seeding ? "Seeding…" : "Seed Demo"}</span>
          </Button>
          <Button variant="outline" size="sm" disabled={seedingPL} onClick={async () => {
            setSeedingPL(true);
            try {
              const { data, error } = await supabase.functions.invoke("seed-paylaterr", { body: { action: "seed_all", user_count: 20, txns_per_user: 6 } });
              if (error) throw error;
              toast.success(`PayLaterr seeded: ${data.transactions_created} transactions, ${data.customers} customers, ${data.knowledge_graph?.nodes} graph nodes`);
              refetchAgents();
            } catch (e: any) { toast.error(e.message || "Failed to seed PayLaterr"); } finally { setSeedingPL(false); }
          }}>
            <Zap className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">{seedingPL ? "Seeding…" : "PayLaterr"}</span>
          </Button>
          <Button variant="default" size="sm" disabled={analyzing || agents.length === 0} onClick={async () => {
            setAnalyzing(true);
            try {
              const { data, error } = await supabase.functions.invoke("analyze-intelligence", { body: { action: "analyze_agents" } });
              if (error) throw error;
              toast.success(`AI found ${data.insights?.length || 0} insights across ${data.agent_count} agents`);
            } catch (e: any) { toast.error(e.message || "Analysis failed"); } finally { setAnalyzing(false); }
          }}>
            <Sparkles className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">{analyzing ? "Analyzing…" : "AI Analysis"}</span>
          </Button>
          <DemoWizard />
        </div>
      </div>

      {isEnterprisePartner && onboarding && (
        <EnterprisePartnerOverview
          onboarding={onboarding}
          handoff={handoff}
          agentsCount={agents.length}
          teamsCount={teamsCount}
          onCreateAgent={() => setCreateOpen(true)}
          onInviteTeam={() => navigate("/dashboard/teams")}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
            className={`rounded-xl border p-5 transition-all duration-200 hover:scale-[1.02] ${s.accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.accent ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Agents & Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Agents</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/agents")}>View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
          {agents.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No agents yet. Create your first agent above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.slice(0, 5).map((agent, i) => (
                <motion.div key={agent.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04, duration: 0.3 }}
                  onClick={() => navigate(`/dashboard/agents/${agent.id}`)}
                  className="rounded-xl border border-border bg-card p-4 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all duration-200 group">
                  <div>
                    <h3 className="font-medium text-foreground">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.domain ?? "No domain"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agent.status === "active" ? "bg-primary/10 text-primary" : agent.status === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                      {agent.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          {recentEvents.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No activity yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {recentEvents.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${evt.event_type === "status_change" ? "bg-primary" : evt.event_type === "created" ? "bg-accent" : "bg-muted-foreground"}`} />
                  <span className="text-sm text-foreground flex-1 truncate">{evt.description}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(evt.created_at), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How It Works: Intelligence Sharing, Decisions & Webhook */}
      <Tabs defaultValue="intelligence" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intelligence"><Brain className="w-4 h-4 mr-1.5" /><span className="hidden sm:inline">Intelligence Sharing</span><span className="sm:hidden">Intel</span></TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="w-4 h-4 mr-1.5" /><span className="hidden sm:inline">Alert Monitoring</span><span className="sm:hidden">Alerts</span></TabsTrigger>
          <TabsTrigger value="webhook"><Webhook className="w-4 h-4 mr-1.5" /><span className="hidden sm:inline">Webhook API</span><span className="sm:hidden">Webhook</span></TabsTrigger>
        </TabsList>

        {/* Intelligence Sharing */}
        <TabsContent value="intelligence">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">How Intelligence & Decisions Are Shared</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Every agent in the network contributes to a shared intelligence layer. Here's the flow:
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Agent Learns", desc: "Each agent records behavioral embeddings and outcomes from its decisions. These learnings are stored with confidence scores." },
                { step: "2", title: "Cross-Domain Transfer", desc: "The AI analysis engine identifies patterns across agents in different domains and creates shared insights that benefit the entire network." },
                { step: "3", title: "Feedback Loop", desc: "Outcomes are fed back through the reinforcement pipeline. Positive results boost confidence; negative results trigger adaptation across all agents." },
              ].map((item) => (
                <div key={item.step} className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{item.step}</div>
                  <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <p><strong>Decision Templates</strong> — Reusable decision frameworks shared across agents. Go to <button onClick={() => navigate("/dashboard/decisions")} className="text-primary underline underline-offset-2 hover:text-primary/80">Decisions</button> to create and manage them.</p>
              <p><strong>Shared Insights</strong> — AI-discovered patterns from cross-agent analysis. View them in <button onClick={() => navigate("/dashboard/intelligence")} className="text-primary underline underline-offset-2 hover:text-primary/80">Intelligence</button>.</p>
              <p><strong>Feedback Pipeline</strong> — Track how outcomes propagate across the network in <button onClick={() => navigate("/dashboard/feedback")} className="text-primary underline underline-offset-2 hover:text-primary/80">Feedback</button>.</p>
            </div>
          </div>
        </TabsContent>

        {/* Alert Monitoring */}
        <TabsContent value="alerts">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Alert Monitoring</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan all agents for performance drops (&lt;50%), error states, and inactivity. Alerts appear as notifications.
            </p>
            <Button variant="outline" disabled={checkingAlerts} onClick={async () => {
              setCheckingAlerts(true);
              try {
                const { data, error } = await supabase.functions.invoke("check-alerts");
                if (error) throw error;
                if (data.count === 0) toast.success("All clear — no alerts detected");
                else toast.warning(`${data.count} alert(s) detected. Check your notifications.`);
              } catch (e: any) { toast.error(e.message || "Alert check failed"); } finally { setCheckingAlerts(false); }
            }}>
              {checkingAlerts ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Bell className="w-4 h-4 mr-1" />}
              Run Alert Check
            </Button>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Agents with performance score below 50% trigger a <strong>performance alert</strong></p>
              <p>• Agents in <strong>error</strong> status generate an immediate notification</p>
              <p>• Agents inactive for over 7 days trigger an <strong>inactivity warning</strong></p>
            </div>
          </div>
        </TabsContent>

        {/* Webhook API */}
        <TabsContent value="webhook">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Webhook API</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Send data from external systems into your agent network via the webhook endpoint.
            </p>
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied!"); }}>Copy</Button>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-xs font-mono space-y-2 overflow-x-auto">
              <p className="text-muted-foreground font-sans text-sm font-medium mb-2">Example: Log an agent event</p>
              <pre className="text-foreground whitespace-pre-wrap">{`curl -X POST ${webhookUrl} \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_type": "agent_event",
    "payload": {
      "agent_id": "AGENT_UUID",
      "type": "decision_made",
      "description": "Approved transaction #1234"
    }
  }'`}</pre>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Supported event types:</strong></p>
              <p>• <code className="bg-muted px-1 rounded">agent_event</code> — Log agent activity</p>
              <p>• <code className="bg-muted px-1 rounded">feedback</code> — Record feedback loop events</p>
              <p>• <code className="bg-muted px-1 rounded">metric</code> — Push intelligence metrics</p>
              <p>• <code className="bg-muted px-1 rounded">agent_update</code> — Update agent status/performance</p>
              <p>• <code className="bg-muted px-1 rounded">batch</code> — Send multiple events at once</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default DashboardOverview;
