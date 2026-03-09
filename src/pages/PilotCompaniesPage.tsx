import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Building2, Plus, Loader2, TrendingDown, TrendingUp, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";

const PilotCompaniesPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["pilot-companies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pilot_companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("pilot_companies").insert({
        user_id: user!.id,
        name,
        vertical: vertical || null,
      });
      if (error) throw error;
      toast.success("Pilot company created");
      setCreateOpen(false);
      setName("");
      setVertical("");
      qc.invalidateQueries({ queryKey: ["pilot-companies"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pilot_companies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["pilot-companies"] });
    }
  };

  const statusColor: Record<string, string> = {
    onboarding: "bg-yellow-500/10 text-yellow-600",
    active: "bg-green-500/10 text-green-600",
    paused: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pilot Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage e-commerce pilot companies in the network</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Company</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Add Pilot Company</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Commerce" required />
              </div>
              <div className="space-y-2">
                <Label>Vertical</Label>
                <Select value={vertical} onValueChange={setVertical}>
                  <SelectTrigger><SelectValue placeholder="Select vertical" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="food">Food & Grocery</SelectItem>
                    <SelectItem value="health">Health & Wellness</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Company"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No pilot companies yet. Add your first company.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.vertical || c.industry}</p>
                </div>
                <Badge variant="outline" className={statusColor[c.status] || statusColor.onboarding}>{c.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Transactions</div>
                  <div className="font-medium text-foreground">{c.total_transactions}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Decisions</div>
                  <div className="font-medium text-foreground">{c.total_decisions}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs flex items-center gap-1">
                    Fraud Rate <TrendingDown className="w-3 h-3" />
                  </div>
                  <div className="font-medium text-foreground">{Number(c.current_fraud_rate || 0).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs flex items-center gap-1">
                    False Positive <TrendingDown className="w-3 h-3" />
                  </div>
                  <div className="font-medium text-foreground">{Number(c.current_false_positive_rate || 0).toFixed(1)}%</div>
                </div>
              </div>

              {c.api_key && (
                <div className="flex gap-2">
                  <Input value={c.api_key} readOnly className="font-mono text-xs flex-1" />
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(c.api_key); toast.success("Copied"); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <ConfirmDelete onConfirm={() => handleDelete(c.id)} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PilotCompaniesPage;
