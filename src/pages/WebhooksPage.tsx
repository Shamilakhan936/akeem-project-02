import { useState } from "react";
import { motion } from "framer-motion";
import { Webhook, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  useWebhookConfigs, useCreateWebhook, useDeleteWebhook, useToggleWebhook,
} from "@/hooks/useWebhookConfigs";

const EVENT_TYPES = [
  { id: "anomaly", label: "Anomaly Detected", desc: "Category risk spikes or reject rate surges" },
  { id: "performance_drop", label: "Performance Drop", desc: "Agent performance below 50%" },
  { id: "agent_error", label: "Agent Error", desc: "Agent enters error state" },
  { id: "stale_agent", label: "Inactive Agent", desc: "No activity in 7+ days" },
  { id: "negative_reinforcement", label: "Negative Trend", desc: "Reinforcement delta trending negative" },
];

export default function WebhooksPage() {
  const { data: webhooks = [], isLoading } = useWebhookConfigs();
  const createMutation = useCreateWebhook();
  const deleteMutation = useDeleteWebhook();
  const toggleMutation = useToggleWebhook();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<string[]>(["anomaly", "performance_drop", "agent_error"]);

  const handleCreate = () => {
    if (!name.trim() || !url.trim()) return;
    createMutation.mutate(
      { name, url, events, secret: secret || undefined },
      { onSuccess: () => { setOpen(false); setName(""); setUrl(""); setSecret(""); setEvents(["anomaly", "performance_drop", "agent_error"]); } }
    );
  };

  const toggleEvent = (eventId: string) => {
    setEvents((prev) => prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
          <p className="text-sm text-muted-foreground mt-1">Push alerts to external URLs when events are detected</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Webhook</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">New Webhook</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Slack Alert" required />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.slack.com/..." required type="url" />
              </div>
              <div className="space-y-2">
                <Label>Secret (optional)</Label>
                <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="HMAC signing secret" />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="space-y-2">
                  {EVENT_TYPES.map((et) => (
                    <label key={et.id} className="flex items-start gap-2 cursor-pointer">
                      <Checkbox checked={events.includes(et.id)} onCheckedChange={() => toggleEvent(et.id)} />
                      <div>
                        <span className="text-sm font-medium text-foreground">{et.label}</span>
                        <p className="text-xs text-muted-foreground">{et.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || events.length === 0}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Webhook"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No webhooks configured. Add one to receive alerts externally.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <Card key={wh.id} className={wh.is_active ? "" : "opacity-60"}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <Webhook className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{wh.name}</span>
                    <Badge variant={wh.is_active ? "default" : "secondary"} className="text-xs">
                      {wh.is_active ? "Active" : "Paused"}
                    </Badge>
                    {wh.failure_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />{wh.failure_count} failures
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono">{wh.url}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {wh.events.map((ev) => (
                      <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMutation.mutate({ id: wh.id, is_active: !wh.is_active })}
                  >
                    {wh.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(wh.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* How it works */}
      <Card>
        <CardHeader><CardTitle className="text-base">How Webhooks Work</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>When alerts are triggered (via Check Alerts or Detect Anomalies), the system sends a POST request to each active webhook URL with a JSON payload containing the alert details.</p>
          <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground overflow-x-auto whitespace-pre">{`{
  "event": "anomaly",
  "timestamp": "2026-03-02T...",
  "alert": {
    "category": "utilities",
    "severity": "high",
    "avg_risk": 75,
    "message": "utilities: avg risk 75%, reject rate 45%"
  }
}`}</div>
          <p>If a signing secret is set, the payload is signed with HMAC-SHA256 in the <code className="text-foreground">X-Webhook-Signature</code> header.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
