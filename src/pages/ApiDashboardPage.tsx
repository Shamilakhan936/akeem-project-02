import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Terminal, Key, Copy, Play, BookOpen, BarChart3, Brain,
  Check, AlertTriangle, Shield, RefreshCw, Loader2, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// ── Playground Tab ──
function PlaygroundTab() {
  const [payload, setPayload] = useState(JSON.stringify({
    action: "score",
    transaction_id: ""
  }, null, 2));
  const [endpoint, setEndpoint] = useState("score-paylaterr");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const body = JSON.parse(payload);
      const { data, error } = await supabase.functions.invoke(endpoint, { body });
      if (error) throw error;
      setResponse(JSON.stringify(data, null, 2));
      toast.success("Request completed");
    } catch (e: any) {
      setResponse(JSON.stringify({ error: e.message }, null, 2));
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" /> Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Select value={endpoint} onValueChange={setEndpoint}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="score-paylaterr">score-paylaterr</SelectItem>
                <SelectItem value="score-transaction">score-transaction</SelectItem>
                <SelectItem value="webhook">webhook</SelectItem>
                <SelectItem value="analyze-intelligence">analyze-intelligence</SelectItem>
                <SelectItem value="network-intelligence">network-intelligence</SelectItem>
                <SelectItem value="paylaterr-intelligence">paylaterr-intelligence</SelectItem>
                <SelectItem value="generate-demo-transactions">generate-demo-transactions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>JSON Body</Label>
            <Textarea
              className="font-mono text-xs min-h-[200px]"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
          </div>
          <Button onClick={run} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Send Request
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" /> Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          {response ? (
            <div className="relative">
              <Button
                variant="ghost" size="sm" className="absolute top-2 right-2"
                onClick={() => { navigator.clipboard.writeText(response); toast.success("Copied"); }}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <pre className="rounded-lg bg-muted/50 p-4 font-mono text-xs text-foreground overflow-auto max-h-[400px] whitespace-pre-wrap">
                {response}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Response will appear here
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Schema Docs Tab ──
const transactionSchema = {
  request: {
    action: { type: "string", required: true, values: '"score" | "score_batch"' },
    transaction_id: { type: "string (UUID)", required: true, note: "Required for action=score" },
  },
  response: {
    success: { type: "boolean" },
    result: {
      type: "object",
      fields: {
        risk_score: "number (0-100)",
        decision: '"approve" | "reject" | "review"',
        confidence: "number (0-1)",
        recommended_installments: "number (2-12)",
        delinquency_risk: '"low" | "medium" | "high" | "critical"',
        early_alert: "boolean",
        alert_message: "string | null",
        risk_factors: "Array<{ factor, severity, description }>",
        reasoning: "string",
        intelligence_used: "string[]",
      },
    },
    thresholds_used: { type: "object", fields: { confidence: "number", riskThreshold: "number" } },
  },
};

function SchemaTab() {
  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(transactionSchema, null, 2));
    toast.success("Schema copied");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">POST /score-paylaterr</CardTitle>
            <Button variant="ghost" size="sm" onClick={copySchema}>
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy Schema
            </Button>
          </div>
          <CardDescription>Score a BNPL transaction and receive AI-powered risk assessment with shared intelligence context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">REQUEST</Badge>
              Body (JSON)
            </h4>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              {Object.entries(transactionSchema.request).map(([key, val]) => (
                <div key={key} className="flex items-start gap-3 text-sm">
                  <code className="text-primary font-mono min-w-[140px]">{key}</code>
                  <span className="text-muted-foreground">{val.type}</span>
                  {val.required && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">required</Badge>}
                  {(val as any).note && <span className="text-xs text-muted-foreground italic">— {(val as any).note}</span>}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 font-mono text-xs">RESPONSE</Badge>
              200 OK
            </h4>
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="text-sm">
                <code className="text-primary font-mono">success</code>
                <span className="text-muted-foreground ml-3">boolean</span>
              </div>
              <div className="text-sm">
                <code className="text-primary font-mono">result</code>
                <span className="text-muted-foreground ml-3">object</span>
              </div>
              <div className="ml-6 space-y-1.5 border-l-2 border-border pl-4">
                {Object.entries(transactionSchema.response.result.fields).map(([key, type]) => (
                  <div key={key} className="flex items-start gap-3 text-xs">
                    <code className="text-foreground font-mono min-w-[180px]">{key}</code>
                    <span className="text-muted-foreground">{type as string}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm mt-2">
                <code className="text-primary font-mono">thresholds_used</code>
                <span className="text-muted-foreground ml-3">{"{ confidence: number, riskThreshold: number }"}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-foreground mb-3">Error Codes</h4>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              {[
                { code: 400, msg: "Invalid request body or unknown action" },
                { code: 401, msg: "Missing or invalid authorization" },
                { code: 402, msg: "AI credits exhausted" },
                { code: 404, msg: "Transaction not found" },
                { code: 429, msg: "Rate limit exceeded" },
                { code: 502, msg: "AI scoring failed" },
              ].map((e) => (
                <div key={e.code} className="flex gap-3">
                  <Badge variant={e.code >= 500 ? "destructive" : "secondary"} className="font-mono text-xs">{e.code}</Badge>
                  <span className="text-muted-foreground">{e.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-foreground mb-3">Example cURL</h4>
            <pre className="rounded-lg bg-muted/50 p-4 font-mono text-xs text-foreground overflow-x-auto whitespace-pre">{`curl -X POST ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-paylaterr \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"score","transaction_id":"<UUID>"}'`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── API Keys Tab ──
function ApiKeysTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["pilot-companies-keys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pilot_companies").select("id, name, status, api_key").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCompany = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pilot_companies").insert({
        name: `API Client ${Date.now().toString(36)}`,
        user_id: user!.id,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pilot-companies-keys"] });
      toast.success("API key created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pilot_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pilot-companies-keys"] });
      toast.success("API key revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" /> API Keys
              </CardTitle>
              <CardDescription>Manage API keys for external integrations</CardDescription>
            </div>
            <Button size="sm" onClick={() => createCompany.mutate()} disabled={createCompany.isPending}>
              <Plus className="w-4 h-4 mr-1" /> Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : !companies?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No API keys yet. Generate one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{c.name}</span>
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono block mt-1 truncate">
                      {revealed[c.id] ? c.api_key : `${c.api_key?.slice(0, 12)}${"•".repeat(20)}`}
                    </code>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setRevealed(r => ({ ...r, [c.id]: !r[c.id] }))}>
                      {revealed[c.id] ? "Hide" : "Show"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(c.api_key || ""); toast.success("Copied"); }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revokeKey.mutate(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Analytics Tab ──
function AnalyticsTab() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["api-usage-stats", user?.id],
    queryFn: async () => {
      const [txnRes, eventsRes, feedbackRes] = await Promise.all([
        supabase.from("transactions").select("id, decision, risk_score, created_at", { count: "exact" }),
        supabase.from("agent_events").select("id", { count: "exact" }),
        supabase.from("feedback_events").select("id", { count: "exact" }),
      ]);

      const txns = txnRes.data || [];
      const scored = txns.filter(t => t.decision !== "pending");
      const avgRisk = scored.length ? scored.reduce((s, t) => s + (t.risk_score ?? 0), 0) / scored.length : 0;

      // Last 24h
      const dayAgo = new Date(Date.now() - 86400000).toISOString();
      const recent = txns.filter(t => t.created_at > dayAgo);

      return {
        totalTransactions: txnRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalFeedback: feedbackRes.count || 0,
        scored: scored.length,
        avgRisk: Math.round(avgRisk),
        last24h: recent.length,
        approveRate: scored.length ? Math.round(scored.filter(t => t.decision === "approve").length / scored.length * 100) : 0,
        rejectRate: scored.length ? Math.round(scored.filter(t => t.decision === "reject").length / scored.length * 100) : 0,
      };
    },
    enabled: !!user,
  });

  const statCards = [
    { label: "Total API Calls", value: stats?.totalTransactions ?? 0, icon: Terminal },
    { label: "Scored", value: stats?.scored ?? 0, icon: Shield },
    { label: "Last 24h", value: stats?.last24h ?? 0, icon: BarChart3 },
    { label: "Avg Risk", value: `${stats?.avgRisk ?? 0}%`, icon: AlertTriangle },
    { label: "Approve Rate", value: `${stats?.approveRate ?? 0}%`, icon: Check },
    { label: "Events Logged", value: stats?.totalEvents ?? 0, icon: RefreshCw },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {statCards.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ── Learning Insights Tab ──
function LearningTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: learnings } = useQuery({
    queryKey: ["anon-learnings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_learnings")
        .select("id, learning_type, embedding_summary, confidence_score, domain, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: insights } = useQuery({
    queryKey: ["anon-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_insights")
        .select("id, title, description, confidence, impact_score, insight_type, source_domains, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const buildIntel = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("paylaterr-intelligence", {
        body: { action: "build_intelligence" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["anon-learnings"] });
      queryClient.invalidateQueries({ queryKey: ["anon-insights"] });
      toast.success(`Intelligence built: ${data.embeddings_stored} embeddings, ${data.insights_stored} insights`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">Anonymized Learning Layer</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Behavioral patterns extracted from scored transactions — anonymized and aggregated for cross-agent intelligence.
          </p>
        </div>
        <Button size="sm" onClick={() => buildIntel.mutate()} disabled={buildIntel.isPending}>
          {buildIntel.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Brain className="w-4 h-4 mr-1" />}
          Build Intelligence
        </Button>
      </div>

      {/* Shared Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aggregate Insights</CardTitle>
          <CardDescription>Cross-domain patterns detected across the network</CardDescription>
        </CardHeader>
        <CardContent>
          {!insights?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No insights yet. Score transactions and build intelligence to generate patterns.</p>
          ) : (
            <div className="space-y-3">
              {insights.map((ins) => (
                <div key={ins.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{ins.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{ins.insight_type}</Badge>
                      <span className="text-xs text-muted-foreground">{Math.round((ins.confidence ?? 0) * 100)}% conf</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{ins.description}</p>
                  {ins.source_domains?.length ? (
                    <div className="flex gap-1 mt-2">
                      {ins.source_domains.map((d) => (
                        <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Behavioral Embeddings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Behavioral Embeddings</CardTitle>
          <CardDescription>Anonymized structured learnings extracted from agent decisions</CardDescription>
        </CardHeader>
        <CardContent>
          {!learnings?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No learnings yet.</p>
          ) : (
            <div className="space-y-2">
              {learnings.map((l) => (
                <div key={l.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{l.embedding_summary}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{l.learning_type}</Badge>
                      {l.domain && <Badge variant="secondary" className="text-[10px]">{l.domain}</Badge>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">
                    {Math.round((l.confidence_score ?? 0) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──
const ApiDashboardPage = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Package API</h1>
        <p className="text-sm text-muted-foreground mt-1">
          POST transactions, get risk scores, manage keys, and explore shared intelligence
        </p>
      </div>

      <Tabs defaultValue="playground" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="playground"><Play className="w-4 h-4 mr-1.5" />Playground</TabsTrigger>
          <TabsTrigger value="schema"><BookOpen className="w-4 h-4 mr-1.5" />Schema</TabsTrigger>
          <TabsTrigger value="keys"><Key className="w-4 h-4 mr-1.5" />API Keys</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" />Usage</TabsTrigger>
          <TabsTrigger value="learning"><Brain className="w-4 h-4 mr-1.5" />Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="playground"><PlaygroundTab /></TabsContent>
        <TabsContent value="schema"><SchemaTab /></TabsContent>
        <TabsContent value="keys"><ApiKeysTab /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="learning"><LearningTab /></TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ApiDashboardPage;
