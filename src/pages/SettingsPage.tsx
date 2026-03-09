import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Camera, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

const SettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { roles, isLoading: rolesLoading } = useUserRole();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      if (data) {
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
      }
      return data;
    },
    enabled: !!user,
  });

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio: bio || null })
      .eq("user_id", user!.id);
    if (error) toast.error(error.message);
    else {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    setUploading(true);
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }
    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl.publicUrl }).eq("user_id", user.id);
    if (updateError) toast.error(updateError.message);
    else { queryClient.invalidateQueries({ queryKey: ["profile"] }); toast.success("Avatar updated!"); }
    setUploading(false);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile & account</p>
      </div>

      {/* Role & Permissions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Roles & Permissions</h3>
        </div>
        {rolesLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Your roles:</span>
              {roles.length === 0 ? (
                <Badge variant="secondary">user</Badge>
              ) : (
                roles.map((role) => (
                  <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>{role}</Badge>
                ))
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>User</strong>: Create & manage your own agents and decisions</p>
              <p>• <strong>Moderator</strong>: Review shared insights and manage team content</p>
              <p>• <strong>Admin</strong>: Full platform access including user management</p>
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Label className="mb-3 block">Avatar</Label>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full bg-muted border border-border overflow-hidden cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-bold">
                {(profile?.display_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin text-foreground" /> : <Camera className="w-5 h-5 text-foreground" />}
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">Upload photo</p>
            <p className="text-xs text-muted-foreground">Click the avatar to upload</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </div>

      {/* Profile Details */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself…" />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>

      {/* Password Change */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Change Password</h3>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
        </div>
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
        </div>
        <Button
          disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
          onClick={async () => {
            if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
            setChangingPassword(true);
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) toast.error(error.message);
            else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); }
            setChangingPassword(false);
          }}
        >
          {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
        </Button>
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>
    </motion.div>
  );
};

export default SettingsPage;
