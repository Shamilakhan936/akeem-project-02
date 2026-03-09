import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Team = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string | null;
  invited_email: string;
  role: "owner" | "admin" | "member";
  status: string;
  created_at: string;
};

export const useTeams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!user,
  });

  const createTeam = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      // Create team
      const { data: team, error } = await supabase
        .from("teams")
        .insert([{ name, description: description || null, owner_id: user!.id }])
        .select()
        .single();
      if (error) throw error;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from("team_members")
        .insert([{
          team_id: team.id,
          user_id: user!.id,
          invited_email: user!.email!,
          role: "owner" as const,
          status: "accepted",
        }]);
      if (memberError) throw memberError;

      return team;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  return { teams, isLoading, createTeam, deleteTeam };
};

export const useTeamMembers = (teamId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user && !!teamId,
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role = "member" }: { email: string; role?: "admin" | "member" }) => {
      const { error } = await supabase
        .from("team_members")
        .insert([{
          team_id: teamId!,
          invited_email: email,
          role,
          status: "pending",
        }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members", teamId] }),
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: "admin" | "member" }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members", teamId] }),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members", teamId] }),
  });

  return { members, isLoading, inviteMember, updateRole, removeMember };
};
