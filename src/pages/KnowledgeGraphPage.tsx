import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2, Circle, GitBranch, Users, Store, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ForceGraph from "@/components/charts/ForceGraph";

const nodeTypeConfig: Record<string, { color: string; icon: any }> = {
  customer: { color: "bg-blue-500", icon: Users },
  merchant: { color: "bg-green-500", icon: Store },
  pattern: { color: "bg-destructive", icon: ShieldAlert },
  order: { color: "bg-yellow-500", icon: Circle },
};

const KnowledgeGraphPage = () => {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ["kg-nodes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_graph_nodes").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: edges = [], isLoading: edgesLoading } = useQuery({
    queryKey: ["kg-edges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_graph_edges").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredNodes = typeFilter === "all" ? nodes : nodes.filter(n => n.node_type === typeFilter);
  const filteredEdges = edges.filter(e => {
    const srcOk = filteredNodes.some(n => n.id === e.source_node_id);
    const tgtOk = filteredNodes.some(n => n.id === e.target_node_id);
    return srcOk && tgtOk;
  });

  const nodeTypes = useMemo(() => {
    const types: Record<string, number> = {};
    nodes.forEach(n => { types[n.node_type] = (types[n.node_type] || 0) + 1; });
    return types;
  }, [nodes]);

  const relTypes = useMemo(() => {
    const types: Record<string, number> = {};
    edges.forEach(e => { types[e.relationship_type] = (types[e.relationship_type] || 0) + 1; });
    return types;
  }, [edges]);

  const isLoading = nodesLoading || edgesLoading;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Graph</h1>
          <p className="text-sm text-muted-foreground mt-1">Cross-agent entity relationships and fraud patterns</p>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="merchant">Merchants</SelectItem>
            <SelectItem value="pattern">Patterns</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Nodes", value: nodes.length },
          { label: "Total Edges", value: edges.length },
          { label: "Entity Types", value: Object.keys(nodeTypes).length },
          { label: "Relationship Types", value: Object.keys(relTypes).length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : nodes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No knowledge graph data yet. Generate demo transactions to populate.</p>
        </div>
      ) : (
        <Tabs defaultValue="graph" className="space-y-4">
          <TabsList>
            <TabsTrigger value="graph">Visual Graph</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="graph">
            <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ height: 520 }}>
              {/* Legend */}
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
                {Object.entries(nodeTypeConfig).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
                <span className="ml-auto">Scroll to zoom · Drag to pan · Hover for details</span>
              </div>
              <div style={{ height: 484 }}>
                <ForceGraph nodes={filteredNodes} edges={filteredEdges} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="table">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Entity types breakdown */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="font-semibold text-foreground">Entity Types</h2>
                {Object.entries(nodeTypes).map(([type, count]) => {
                  const config = nodeTypeConfig[type] || { color: "bg-muted-foreground", icon: Circle };
                  const Icon = config.icon;
                  return (
                    <div key={type} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground capitalize">{type}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
              </div>

              {/* Relationships */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="font-semibold text-foreground">Relationships</h2>
                {Object.entries(relTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{type.replace(/_/g, " ")}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>

              {/* Node table */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">Nodes ({filteredNodes.length})</h2>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Label</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Domain</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Weight</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Connections</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNodes.map(node => {
                        const config = nodeTypeConfig[node.node_type] || { color: "bg-muted-foreground", icon: Circle };
                        const connectionCount = edges.filter(e => e.source_node_id === node.id || e.target_node_id === node.id).length;
                        return (
                          <tr key={node.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                <span className="text-foreground capitalize">{node.node_type}</span>
                              </div>
                            </td>
                            <td className="p-3 text-foreground font-medium">{node.label}</td>
                            <td className="p-3 text-muted-foreground">{node.domain || "—"}</td>
                            <td className="p-3 text-right text-foreground">{Number(node.weight).toFixed(1)}</td>
                            <td className="p-3 text-right text-foreground">{connectionCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
};

export default KnowledgeGraphPage;
