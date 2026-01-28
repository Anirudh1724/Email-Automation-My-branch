import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import {
  useUnsubscribeList,
  useAddToUnsubscribeList,
  useRemoveFromUnsubscribeList,
  useDomainBlacklist,
  useAddToDomainBlacklist,
  useRemoveFromDomainBlacklist,
} from "@/hooks/useUnsubscribe";
import { useTeamMembers, useInviteTeamMember, useRemoveTeamMember } from "@/hooks/useTeamMembers";
import { useDomains, useCreateDomain, useDeleteDomain, useVerifyDomain } from "@/hooks/useDomains";
import { Loader2, Trash2, CheckCircle, Clock, XCircle, Lock, Globe, UserX, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, updatePassword } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const { data: unsubscribeList, isLoading: unsubscribeLoading } = useUnsubscribeList();
  const addToUnsubscribe = useAddToUnsubscribeList();
  const removeFromUnsubscribe = useRemoveFromUnsubscribeList();

  const { data: domainBlacklist, isLoading: blacklistLoading } = useDomainBlacklist();
  const addToBlacklist = useAddToDomainBlacklist();
  const removeFromBlacklist = useRemoveFromDomainBlacklist();

  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();
  const inviteMember = useInviteTeamMember();
  const removeMember = useRemoveTeamMember();

  const { data: domains, isLoading: domainsLoading } = useDomains();
  const addDomain = useCreateDomain();
  const deleteDomain = useDeleteDomain();
  const verifyDomain = useVerifyDomain();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  });

  const [unsubscribeEmail, setUnsubscribeEmail] = useState("");
  const [blacklistDomain, setBlacklistDomain] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (profile || user) {
      setFormData({
        full_name: profile?.full_name || user?.user_metadata?.full_name || "",
        email: profile?.email || user?.email || "",
        company: profile?.company || "",
        timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
      });
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync({
      full_name: formData.full_name,
      company: formData.company,
      timezone: formData.timezone,
    });
  };

  const handleAddUnsubscribe = async () => {
    if (!unsubscribeEmail.trim()) return;
    await addToUnsubscribe.mutateAsync({ email: unsubscribeEmail.trim() });
    setUnsubscribeEmail("");
  };

  const handleAddBlacklist = async () => {
    if (!blacklistDomain.trim()) return;
    await addToBlacklist.mutateAsync(blacklistDomain.trim());
    setBlacklistDomain("");
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    await inviteMember.mutateAsync({ email: inviteEmail.trim() });
    setInviteEmail("");
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    await addDomain.mutateAsync(newDomain.trim());
    setNewDomain("");
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    const { error } = await updatePassword(newPassword);

    if (error) {
      toast.error(`Failed to update password: ${error.message}`);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="p-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="unsubscribe">Unsubscribe</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              <h3 className="font-bold text-2xl text-foreground">Global Configuration</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                Manage your identification and regional settings
              </p>
              <Separator className="my-8 opacity-40" />
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-8 max-w-xl">
                  <div className="grid gap-3">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Full Identity</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="h-14 bg-background/50 border-border/50 rounded-2xl focus:bg-background transition-all text-base font-medium dark:bg-slate-900/50 dark:border-white/10"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Account Identifier</Label>
                    <Input id="email" value={formData.email} disabled className="h-14 bg-muted/20 border-white/10 rounded-2xl opacity-60" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Identifier is locked for security</p>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Organization</Label>
                    <Input
                      id="company"
                      placeholder="Company name"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="h-14 bg-background/50 border-border/50 rounded-2xl focus:bg-background transition-all text-base font-medium dark:bg-slate-900/50 dark:border-white/10"
                    />
                  </div>
                  <Button
                    className="w-fit px-10 h-14 shadow-premium hover:shadow-primary/40 transition-all rounded-full font-black text-sm uppercase tracking-widest"
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Apply Modifications"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-foreground">Timezone</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set your timezone for scheduling
              </p>
              <Separator className="my-6" />
              <Select
                value={formData.timezone}
                onValueChange={(value) => {
                  setFormData({ ...formData, timezone: value });
                  updateProfile.mutate({ timezone: value });
                }}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-10 relative overflow-hidden">
              <div className="flex items-center gap-5 mb-10">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/10 shadow-inner border border-white/20">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-foreground">Security Vault</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                    Manage your account password and security protocols
                  </p>
                </div>
              </div>
              <Separator className="my-8 opacity-40" />
              <div className="grid gap-8 max-w-xl">
                <div className="grid gap-3">
                  <Label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">New Protocol Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="h-14 bg-background/50 border-border/50 rounded-2xl focus:bg-background transition-all text-base font-medium dark:bg-slate-900/50 dark:border-white/10"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Confirm Protocol</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Verify protocol matching"
                    className="h-14 bg-background/50 border-border/50 rounded-2xl focus:bg-background transition-all text-base font-medium dark:bg-slate-900/50 dark:border-white/10"
                  />
                </div>
                <Button
                  className="w-fit px-10 h-14 shadow-premium hover:shadow-primary/40 transition-all rounded-full font-black text-sm uppercase tracking-widest"
                  onClick={handleUpdatePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Authorize Protocol"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="domains" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-10 relative overflow-hidden">
              <div className="flex items-center gap-5 mb-10">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary/10 shadow-inner border border-white/20">
                  <Globe className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-foreground">Tracking Domains</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                    Add custom domains for email tracking
                  </p>
                </div>
              </div>
              <Separator className="my-8 opacity-40" />
              <div className="grid gap-8 max-w-xl">
                <div className="grid gap-3">
                  <Label htmlFor="newDomain" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Add New Domain</Label>
                  <div className="flex gap-4">
                    <Input
                      id="newDomain"
                      placeholder="track.yourdomain.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="h-14 bg-background/50 border-border/50 rounded-2xl focus:bg-background transition-all text-base font-medium flex-1 dark:bg-slate-900/50 dark:border-white/10"
                    />
                    <Button
                      onClick={handleAddDomain}
                      disabled={addDomain.isPending}
                      className="h-14 px-8 rounded-2xl shadow-premium hover:shadow-primary/40 transition-all font-black text-sm uppercase tracking-widest"
                    >
                      {addDomain.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deploy"}
                    </Button>
                  </div>
                </div>

                {domainsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : domains && domains.length > 0 ? (
                  <div className="space-y-2">
                    {domains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {domain.status === "verified" ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-warning" />
                          )}
                          <span className="text-sm">{domain.domain}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            ({domain.status})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {domain.status !== "verified" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verifyDomain.mutate(domain.id)}
                              disabled={verifyDomain.isPending}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDomain.mutate(domain.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    <p>No domains added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="unsubscribe" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-10 relative overflow-hidden">
              <div className="flex items-center gap-5 mb-10">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-destructive/10 shadow-inner border border-white/20">
                  <UserX className="h-7 w-7 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-foreground">
                    Global Suppression List
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                    Manage emails that should never receive campaigns
                  </p>
                </div>
              </div>
              <Separator className="my-8 opacity-40" />
              <div className="grid gap-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="unsubscribeEmail">Add Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="unsubscribeEmail"
                      placeholder="email@example.com"
                      value={unsubscribeEmail}
                      onChange={(e) => setUnsubscribeEmail(e.target.value)}
                    />
                    <Button onClick={handleAddUnsubscribe} disabled={addToUnsubscribe.isPending}>
                      {addToUnsubscribe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                </div>

                {unsubscribeLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : unsubscribeList && unsubscribeList.length > 0 ? (
                  <div className="rounded-lg border divide-y max-h-48 overflow-auto">
                    {unsubscribeList.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3"
                      >
                        <span className="text-sm">{entry.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromUnsubscribe.mutate(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    <p>No emails in the unsubscribe list yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-10 relative overflow-hidden">
              <div className="flex items-center gap-5 mb-10">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-amber-500/10 shadow-inner border border-white/20">
                  <ShieldAlert className="h-7 w-7 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-foreground">
                    Domain Blacklist
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                    Block entire domains from receiving emails
                  </p>
                </div>
              </div>
              <Separator className="my-8 opacity-40" />
              <div className="grid gap-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="blacklistDomain">Add Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="blacklistDomain"
                      placeholder="example.com"
                      value={blacklistDomain}
                      onChange={(e) => setBlacklistDomain(e.target.value)}
                    />
                    <Button onClick={handleAddBlacklist} disabled={addToBlacklist.isPending}>
                      {addToBlacklist.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                </div>

                {blacklistLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : domainBlacklist && domainBlacklist.length > 0 ? (
                  <div className="rounded-lg border divide-y max-h-48 overflow-auto">
                    {domainBlacklist.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3"
                      >
                        <span className="text-sm">{entry.domain}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromBlacklist.mutate(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    <p>No domains in the blacklist yet.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-foreground">Team Members</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Invite and manage team members
              </p>
              <Separator className="my-6" />
              <div className="grid gap-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="inviteEmail">Invite by Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="inviteEmail"
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button onClick={handleInviteMember} disabled={inviteMember.isPending}>
                      {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                    </Button>
                  </div>
                </div>

                {teamLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                  <div className="rounded-lg border divide-y">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3"
                      >
                        <div>
                          <span className="text-sm font-medium">{member.member_email}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${member.status === "accepted" ? "bg-success/10 text-success" :
                              "bg-warning/10 text-warning"
                              }`}>
                              {member.status}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember.mutate(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    <p>No team members yet.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
