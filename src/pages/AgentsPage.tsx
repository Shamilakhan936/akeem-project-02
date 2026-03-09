import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Plus, Trash2, Loader2, ChevronRight, Search } from "lucide-react";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusFilters = ["all", "active", "draft", "paused", "error"] as const;

const AgentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: agents = [], isLoading } = useQuery({
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

  const filtered = agents.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.domain ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const createAgent = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("agents").insert([{
        name,
        description: description || null,
        domain: domain || null,
        user_id: user!.id,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      supabase.from("agent_events").insert([{
        agent_id: data.id,
        user_id: user!.id,
        event_type: "created",
        description: `Agent "${data.name}" created`,
      }]);
      createNotification("Agent Created", `"${data.name}" has been created successfully.`, "created", data.id);
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setOpen(false);
      setName("");
      setDescription("");
      setDomain("");
      toast.success("Agent created!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const agent = agents.find((a) => a.id === id);
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
      return agent;
    },
    onSuccess: (agent) => {
      if (agent) createNotification("Agent Deleted", `"${agent.name}" has been deleted.`, "deleted");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your AI agents</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Agent</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAgent.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Agent" required />
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. Customer Support" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do?" rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={createAgent.isPending}>
                {createAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Agent"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">
            {agents.length === 0 ? "No agents yet" : "No matching agents"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {agents.length === 0
              ? "Create your first agent to start building."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => navigate(`/dashboard/agents/${agent.id}`)}
              className="rounded-xl border border-border bg-card p-5 flex items-center justify-between cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-all duration-200 group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{agent.name}</h3>
                {agent.domain && <p className="text-xs text-primary">{agent.domain}</p>}
                {agent.description && <p className="text-sm text-muted-foreground truncate">{agent.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>{agent.shared_learnings} learnings</span>
                  <span>Score: {agent.performance_score ?? 0}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    agent.status === "active"
                      ? "bg-primary/10 text-primary"
                      : agent.status === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {agent.status}
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <ConfirmDelete
                    title={`Delete "${agent.name}"?`}
                    description="This will permanently delete the agent and all its activity data."
                    onConfirm={() => deleteAgent.mutate(agent.id)}
                  />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
