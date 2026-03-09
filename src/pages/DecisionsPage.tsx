import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Trash2, Shield, Truck, ShoppingCart, Megaphone, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDecisionTemplates, useCreateDecisionTemplate, useDeleteDecisionTemplate } from "@/hooks/useDecisions";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";

const decisionTypes = [
  { value: "fraud_detection", label: "Fraud Detection", icon: Shield, color: "text-destructive" },
  { value: "route_optimization", label: "Route Optimization", icon: Truck, color: "text-primary" },
  { value: "inventory_restock", label: "Inventory Restock", icon: ShoppingCart, color: "text-accent" },
  { value: "ad_budget", label: "Ad Budget Allocation", icon: Megaphone, color: "text-chart-4" },
];

const defaultMetrics: Record<string, { name: string; target: number; unit: string }[]> = {
  fraud_detection: [
    { name: "Precision", target: 95, unit: "%" },
    { name: "Recall", target: 90, unit: "%" },
    { name: "False Positive Rate", target: 5, unit: "%" },
  ],
  route_optimization: [
    { name: "On-time Delivery", target: 95, unit: "%" },
    { name: "Fuel Cost Reduction", target: 15, unit: "%" },
    { name: "Avg Delivery Time", target: 30, unit: "min" },
  ],
  inventory_restock: [
    { name: "Stockout Rate", target: 2, unit: "%" },
    { name: "Overstock Cost", target: 10, unit: "%" },
    { name: "Reorder Accuracy", target: 92, unit: "%" },
  ],
  ad_budget: [
    { name: "ROAS", target: 4, unit: "x" },
    { name: "CPA", target: 25, unit: "$" },
    { name: "Conversion Lift", target: 20, unit: "%" },
  ],
};

const DecisionsPage = () => {
  const { data: templates, isLoading } = useDecisionTemplates();
  const createTemplate = useCreateDecisionTemplate();
  const deleteTemplate = useDeleteDecisionTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    decision_type: "",
    description: "",
  });

  const handleCreate = () => {
    if (!form.name || !form.decision_type) return;
    createTemplate.mutate(
      {
        name: form.name,
        decision_type: form.decision_type,
        description: form.description,
        metrics: defaultMetrics[form.decision_type] || [],
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ name: "", decision_type: "", description: "" });
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Decision Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">Define what decisions your agents make and how to measure them</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Decision Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Decision Type</Label>
                <Select value={form.decision_type} onValueChange={(v) => setForm((p) => ({ ...p, decision_type: v, name: p.name || decisionTypes.find((d) => d.value === v)?.label || "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {decisionTypes.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Fraud Approval Pipeline" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What this decision covers…" rows={3} />
              </div>
              {form.decision_type && (
                <div>
                  <Label className="text-xs text-muted-foreground">Default Metrics</Label>
                  <div className="mt-2 space-y-1">
                    {(defaultMetrics[form.decision_type] || []).map((m) => (
                      <div key={m.name} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted">
                        <span className="text-foreground">{m.name}</span>
                        <span className="text-muted-foreground">Target: {m.target}{m.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleCreate} disabled={createTemplate.isPending || !form.name || !form.decision_type} className="w-full">
                {createTemplate.isPending ? "Creating…" : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : templates?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t, i) => {
            const typeInfo = decisionTypes.find((d) => d.value === t.decision_type);
            const Icon = typeInfo?.icon || Bot;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className={`w-5 h-5 ${typeInfo?.color || "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{t.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] mt-1">{typeInfo?.label || t.decision_type}</Badge>
                        </div>
                      </div>
                      <ConfirmDelete
                        title="Delete template?"
                        description="This will remove the decision template."
                        onConfirm={() => deleteTemplate.mutate(t.id)}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ConfirmDelete>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {t.description && <p className="text-xs text-muted-foreground mb-3">{t.description}</p>}
                    <div className="space-y-1.5">
                      {(t.metrics || []).map((m) => (
                        <div key={m.name} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-muted/50">
                          <span className="text-foreground font-medium">{m.name}</span>
                          <span className="text-muted-foreground">Target: {m.target}{m.unit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No decision templates yet. Create one to define agent decisions & metrics.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DecisionsPage;
