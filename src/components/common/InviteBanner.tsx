import { usePendingInvites } from "@/hooks/usePendingInvites";
import { Button } from "@/components/ui/button";
import { Users, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function InviteBanner() {
  const { invites, acceptInvite, declineInvite } = usePendingInvites();

  if (invites.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-2 mb-4">
        {invites.map((invite) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                You've been invited to join <span className="text-primary">{invite.team_name}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Role: {invite.role} · Invited via {invite.invited_email}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  declineInvite.mutate(invite.id, {
                    onSuccess: () => toast.info("Invitation declined"),
                    onError: (e) => toast.error(e.message),
                  })
                }
                disabled={declineInvite.isPending}
                className="text-muted-foreground"
              >
                {declineInvite.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1" /> Decline</>}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  acceptInvite.mutate(invite.id, {
                    onSuccess: () => toast.success("You've joined the team!"),
                    onError: (e) => toast.error(e.message),
                  })
                }
                disabled={acceptInvite.isPending}
              >
                {acceptInvite.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Accept</>}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
