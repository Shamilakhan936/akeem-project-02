import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PendingInvite = {
  id: string;
  team_id: string;
  invited_email: string;
  role: "owner" | "admin" | "member";
  status: string;
  created_at: string;
  team_name?: string;
};

export const usePendingInvites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["pending-invites", user?.email],
    queryFn: async () => {
      // Find pending invitations matching user's email
      const { data, error } = await supabase
        .from("team_members")
        .select("*, teams(name)")
        .eq("invited_email", user!.email!)
        .eq("status", "pending");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        team_name: d.teams?.name ?? "Unknown Team",
      })) as PendingInvite[];
    },
    enabled: !!user?.email,
  });

  const acceptInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("team_members")
        .update({ user_id: user!.id, status: "accepted" })
        .eq("id", inviteId)
        .eq("invited_email", user!.email!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });

  const declineInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", inviteId)
        .eq("invited_email", user!.email!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
    },
  });

  return { invites, isLoading, acceptInvite, declineInvite };
};
