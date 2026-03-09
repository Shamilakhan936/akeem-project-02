import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentEvents } from "@/hooks/useAgentEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Play,
  Pause,
  Trash2,
  Save,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { formatDistanceToNow } from "date-fns";

const statusOptions = ["draft", "active", "paused", "error"] as const;

const AgentDetailPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { events, isLoading: eventsLoading, logEvent } = useAgentEvents(agentId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId!)
        .single();
      if (error) throw error;
      setName(data.name);
      setDescription(data.description ?? "");
      setDomain(data.domain ?? "");
      return data;
    },
    enabled: !!user && !!agentId,
  });

  const updateAgent = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("agents")
        .update(updates)
        .eq("id", agentId!);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      const desc = variables.status
        ? `Status changed to ${variables.status}`
        : "Configuration updated";
      logEvent.mutate({
        agentId: agentId!,
        eventType: variables.status ? "status_change" : "config_update",
        description: desc,
        metadata: variables,
      });
      toast.success("Agent updated");
      setIsEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAgent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agents").delete().eq("id", agentId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent deleted");
      navigate("/dashboard/agents");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "paused" : "active";
    updateAgent.mutate({ status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Agent not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/dashboard/agents")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Agents
        </Button>
      </div>
    );
  }

  const stats = [
    { label: "Status", value: agent.status, icon: Activity, color: agent.status === "active" ? "text-primary" : "text-muted-foreground" },
    { label: "Learnings", value: agent.shared_learnings.toLocaleString(), icon: Zap, color: "text-accent" },
    { label: "Performance", value: `${agent.performance_score ?? 0}%`, icon: TrendingUp, color: "text-primary" },
    { label: "Created", value: new Date(agent.created_at).toLocaleDateString(), icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/agents")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                agent.status === "active"
                  ? "bg-primary/10 text-primary"
                  : agent.status === "error"
                  ? "bg-destructive/10 text-destructive"
                  : agent.status === "paused"
                  ? "bg-accent/10 text-accent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {agent.status}
            </span>
          </div>
          {agent.domain && <p className="text-sm text-muted-foreground mt-0.5">{agent.domain}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={agent.status === "active" ? "outline" : "default"}
            size="sm"
            onClick={toggleStatus}
            disabled={updateAgent.isPending}
          >
            {agent.status === "active" ? (
              <><Pause className="w-3.5 h-3.5 mr-1" /> Pause</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1" /> Activate</>
            )}
          </Button>
          <ConfirmDelete
            title={`Delete "${agent.name}"?`}
            description="This will permanently delete this agent and all its activity data."
            onConfirm={() => deleteAgent.mutate()}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Config */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Configuration</h2>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setName(agent.name);
                  setDescription(agent.description ?? "");
                  setDomain(agent.domain ?? "");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updateAgent.isPending}
                onClick={() => updateAgent.mutate({ name, description: description || null, domain: domain || null })}
              >
                {updateAgent.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1" /> Save</>}
              </Button>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Name</Label>
            {isEditing ? (
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <p className="text-foreground font-medium">{agent.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Domain</Label>
            {isEditing ? (
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. Fraud Detection" />
            ) : (
              <p className="text-foreground font-medium">{agent.domain || "—"}</p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-muted-foreground">Description</Label>
            {isEditing ? (
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            ) : (
              <p className="text-foreground">{agent.description || "No description"}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Activity Log placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Activity Log</h2>
        {eventsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    evt.event_type === "status_change" ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />
                <span className="text-sm text-foreground flex-1">{evt.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(evt.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AgentDetailPage;
