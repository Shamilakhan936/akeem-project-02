import { useState } from "react";
import { useTeams, useTeamMembers } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  Mail,
  Crown,
  Shield,
  User,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const TeamPage = () => {
  const { user } = useAuth();
  const { teams, isLoading, createTeam, deleteTeam } = useTeams();
  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (selectedTeam) {
    return (
      <TeamDetail
        team={selectedTeam}
        onBack={() => setSelectedTeamId(null)}
        isOwner={selectedTeam.owner_id === user?.id}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground text-sm mt-1">Collaborate and share agents with your team</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Team</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTeam.mutate(
                  { name: teamName, description: teamDesc },
                  {
                    onSuccess: () => {
                      setCreateOpen(false);
                      setTeamName("");
                      setTeamDesc("");
                      toast.success("Team created!");
                    },
                    onError: (err) => toast.error(err.message),
                  }
                );
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Engineering" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} placeholder="What is this team for?" rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                {createTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Team"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No teams yet</h3>
          <p className="text-muted-foreground text-sm">Create a team to start collaborating with others.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => setSelectedTeamId(team.id)}
              className="rounded-xl border border-border bg-card p-5 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{team.name}</h3>
                {team.description && <p className="text-sm text-muted-foreground truncate">{team.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {team.owner_id === user?.id ? "Owner" : "Member"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {team.owner_id === user?.id && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ConfirmDelete
                      title={`Delete "${team.name}"?`}
                      description="This will permanently delete the team and remove all members."
                      onConfirm={() =>
                        deleteTeam.mutate(team.id, {
                          onSuccess: () => toast.success("Team deleted"),
                          onError: (err) => toast.error(err.message),
                        })
                      }
                    />
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

function TeamDetail({ team, onBack, isOwner }: { team: { id: string; name: string; description: string | null }; onBack: () => void; isOwner: boolean }) {
  const { members, isLoading, inviteMember, updateRole, removeMember } = useTeamMembers(team.id);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
          {team.description && <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>}
        </div>
        {isOwner && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Mail className="w-3.5 h-3.5 mr-1" /> Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Invite Member</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  inviteMember.mutate(
                    { email: inviteEmail, role: inviteRole },
                    {
                      onSuccess: () => {
                        setInviteOpen(false);
                        setInviteEmail("");
                        toast.success("Invitation sent!");
                      },
                      onError: (err) => toast.error(err.message),
                    }
                  );
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "member" | "admin")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={inviteMember.isPending}>
                  {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invitation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Members</h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No members yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role] || User;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.invited_email}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        member.role === "owner"
                          ? "bg-accent/10 text-accent"
                          : member.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {member.role}
                      </span>
                      {member.status === "pending" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          pending
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwner && member.role !== "owner" && (
                    <div className="flex items-center gap-1">
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          updateRole.mutate(
                            { memberId: member.id, role: v as "admin" | "member" },
                            { onError: (err) => toast.error(err.message) }
                          )
                        }
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          removeMember.mutate(member.id, {
                            onSuccess: () => toast.success("Member removed"),
                            onError: (err) => toast.error(err.message),
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default TeamPage;
