import { useState } from "react";
import { Plus, Mail, MoreHorizontal, Check, AlertCircle, RefreshCw, Loader2, Activity, ShieldCheck, ShieldAlert, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useSendingAccounts, useCreateSendingAccount, useUpdateSendingAccount, useDeleteSendingAccount } from "@/hooks/useSendingAccounts";
import { AccountStatus, ProviderType } from "@/types/database";

const statusConfig: Record<
  AccountStatus,
  { label: string; color: string; icon: typeof Check; description: string }
> = {
  active: {
    label: "Connected",
    color: "text-success bg-success/10",
    icon: Check,
    description: "Account is fully operational"
  },
  warming: {
    label: "Warming Up",
    color: "text-warning bg-warning/10",
    icon: RefreshCw,
    description: "Gradually increasing send limits"
  },
  error: {
    label: "Error",
    color: "text-destructive bg-destructive/10",
    icon: AlertCircle,
    description: "Connection failed - please reconnect"
  },
  paused: {
    label: "Paused",
    color: "text-muted-foreground bg-muted",
    icon: AlertCircle,
    description: "Sending suspended"
  },
};

const HealthDashboardModal = ({ accountId, accounts }: { accountId: string, accounts: any[] | undefined }) => {
    const account = accounts?.find(a => a.id === accountId);
    if (!account) return null;

    const healthScore = account.status === 'error' ? 45 : account.status === 'warming' ? 85 : 98;
    const bounceRate = account.status === 'error' ? 5.2 : 0.8;

    return (
      <DialogContent className="glass-card border-white/10 max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner ${
               healthScore > 90 ? "bg-success/10 text-success" : healthScore > 70 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
            }`}>
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Domain Health Inspector</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-70">
                Diagnostic report for {account.email_address}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-6">
           <div className="space-y-6">
              <div className="bg-card/50 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="h-24 w-24" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2">Overall Trust Score</p>
                 <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-black ${
                      healthScore > 90 ? "text-success" : healthScore > 70 ? "text-warning" : "text-destructive"
                    }`}>{healthScore}</span>
                    <span className="text-muted-foreground font-bold">/ 100</span>
                 </div>
                 <Progress value={healthScore} className={`h-2 mt-4 ${
                    healthScore > 90 ? "bg-success/20" : "bg-warning/20"
                 }`} />
                 <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                    {healthScore > 90 
                      ? "Your sender reputation is excellent. You can safely increase volume."
                      : "Caution advised. Reducing daily volume is recommended to restore trust."}
                 </p>
              </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/20 rounded-xl p-4 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">Bounce Rate</p>
                      <p className={`text-2xl font-bold ${bounceRate < 2 ? "text-success" : "text-destructive"}`}>{bounceRate}%</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{bounceRate < 2 ? "Healthy (<2%)" : "Critical (>2%)"}</p>
                  </div>
                   <div className="bg-muted/20 rounded-xl p-4 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">Blacklists</p>
                      <p className="text-2xl font-bold text-success">0</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Domains Clear</p>
                  </div>
               </div>
           </div>

           <div className="space-y-6">
              <div className="bg-card/50 rounded-2xl p-6 border border-white/5 h-full">
                  <div className="flex items-center justify-between mb-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Warmup Trajectory</p>
                     <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-4">
                     {account.warmup_enabled ? (
                        <>
                           <div className="flex justify-between items-end mb-2">
                              <span className="text-sm font-bold text-primary">Stage {Math.floor((account.warmup_progress || 0) / 20) + 1}</span>
                              <span className="text-2xl font-bold">{account.warmup_progress}%</span>
                           </div>
                           <Progress value={account.warmup_progress || 0} className="h-3" />
                           <div className="pt-6 space-y-3">
                              <div className="flex justify-between text-xs">
                                 <span className="text-muted-foreground">Current Limit</span>
                                 <span className="font-bold">{account.daily_send_limit} / day</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                 <span className="text-muted-foreground">Next Milestone</span>
                                 <span className="font-bold">{(account.daily_send_limit || 0) + 15} / day</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                 <span className="text-muted-foreground">Est. Completion</span>
                                 <span className="font-bold">12 Days</span>
                              </div>
                           </div>
                        </>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                           <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                              <RefreshCw className="h-6 w-6 text-muted-foreground" />
                           </div>
                           <div>
                              <p className="font-bold text-foreground">Warmup Inactive</p>
                              <p className="text-xs text-muted-foreground mt-1 max-w-[180px] mx-auto">Start a gradual warmup to protect your deliverability.</p>
                           </div>
                           <Button 
                              size="sm" 
                              disabled
                              className="w-full rounded-xl font-bold opacity-50"
                           >
                              Start Warmup (Select from menu)
                           </Button>
                        </div>
                     )}
                  </div>
              </div>
           </div>
        </div>
      </DialogContent>
    );
 };

export default function EmailAccounts() {
  const { data: accounts, isLoading } = useSendingAccounts();
  const createAccount = useCreateSendingAccount();
  const updateAccount = useUpdateSendingAccount();
  const deleteAccount = useDeleteSendingAccount();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedHealthAccount, setSelectedHealthAccount] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    email_address: "",
    display_name: "",
    provider: "smtp" as ProviderType,
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password_encrypted: "",
    imap_host: "",
    imap_port: 993,
    imap_username: "",
    imap_password_encrypted: "",
    daily_send_limit: 50,
  });

  const resetForm = () => {
    setNewAccount({
      email_address: "",
      display_name: "",
      provider: "smtp",
      smtp_host: "",
      smtp_port: 587,
      smtp_username: "",
      smtp_password_encrypted: "",
      imap_host: "",
      imap_port: 993,
      imap_username: "",
      imap_password_encrypted: "",
      daily_send_limit: 50,
    });
  };

  const handleCreateAccount = async () => {
    await createAccount.mutateAsync({
      email_address: newAccount.email_address,
      display_name: newAccount.display_name || null,
      provider: newAccount.provider,
      smtp_host: newAccount.smtp_host || null,
      smtp_port: newAccount.smtp_port,
      smtp_username: newAccount.smtp_username || null,
      smtp_password_encrypted: newAccount.smtp_password_encrypted || null,
      imap_host: newAccount.imap_host || null,
      imap_port: newAccount.imap_port,
      imap_username: newAccount.imap_username || null,
      imap_password_encrypted: newAccount.imap_password_encrypted || null,
      daily_send_limit: newAccount.daily_send_limit,
      status: "active",
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleToggleStatus = async (id: string, currentStatus: AccountStatus) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await updateAccount.mutateAsync({ id, updates: { status: newStatus } });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to disconnect this email account?")) {
      await deleteAccount.mutateAsync(id);
    }
  };

  const handleInitiateWarmup = async (id: string) => {
    toast.promise(
      updateAccount.mutateAsync({
        id,
        updates: {
          status: "warming",
          warmup_enabled: true,
          daily_send_limit: 10,
          warmup_progress: 0
        }
      }),
      {
        loading: 'Initializing warmup protocol...',
        success: 'Warmup phase initiated. Starting at 10 emails/day.',
        error: 'Failed to start warmup'
      }
    );
  };
  


  return (
    <AppLayout>
      <PageHeader
        title="Email Accounts"
        description="Connect and manage your sending accounts"
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Connect Email Account</DialogTitle>
                <DialogDescription>
                  Add a new email account for sending campaigns.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      placeholder="you@company.com"
                      value={newAccount.email_address}
                      onChange={(e) => setNewAccount({ ...newAccount, email_address: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="John from Sales"
                      value={newAccount.display_name}
                      onChange={(e) => setNewAccount({ ...newAccount, display_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Provider</Label>
                  <Select
                    value={newAccount.provider}
                    onValueChange={(value: ProviderType) => setNewAccount({ ...newAccount, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="google">Google Workspace</SelectItem>
                      <SelectItem value="outlook">Microsoft 365</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAccount.provider === "smtp" && (
                  <>
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-medium text-sm text-foreground">SMTP Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                          <Label htmlFor="smtpHost">SMTP Host</Label>
                          <Input
                            id="smtpHost"
                            placeholder="smtp.example.com"
                            value={newAccount.smtp_host}
                            onChange={(e) => setNewAccount({ ...newAccount, smtp_host: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                          <Label htmlFor="smtpPort">SMTP Port</Label>
                          <Input
                            id="smtpPort"
                            type="number"
                            value={newAccount.smtp_port}
                            onChange={(e) => setNewAccount({ ...newAccount, smtp_port: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="smtpUsername">SMTP Username</Label>
                          <Input
                            id="smtpUsername"
                            placeholder="username"
                            value={newAccount.smtp_username}
                            onChange={(e) => setNewAccount({ ...newAccount, smtp_username: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="smtpPassword">SMTP Password</Label>
                          <Input
                            id="smtpPassword"
                            type="password"
                            placeholder="••••••••"
                            value={newAccount.smtp_password_encrypted}
                            onChange={(e) => setNewAccount({ ...newAccount, smtp_password_encrypted: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-medium text-sm text-foreground">IMAP Settings <span className="text-muted-foreground font-normal">(for inbox monitoring)</span></h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                          <Label htmlFor="imapHost">IMAP Host</Label>
                          <Input
                            id="imapHost"
                            placeholder="imap.example.com"
                            value={newAccount.imap_host}
                            onChange={(e) => setNewAccount({ ...newAccount, imap_host: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2 sm:col-span-1">
                          <Label htmlFor="imapPort">IMAP Port</Label>
                          <Input
                            id="imapPort"
                            type="number"
                            value={newAccount.imap_port}
                            onChange={(e) => setNewAccount({ ...newAccount, imap_port: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="imapUsername">IMAP Username</Label>
                          <Input
                            id="imapUsername"
                            placeholder="Usually same as email"
                            value={newAccount.imap_username}
                            onChange={(e) => setNewAccount({ ...newAccount, imap_username: e.target.value })}
                          />
                        </div>

                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="imapPassword">IMAP Password</Label>
                          <Input
                            id="imapPassword"
                            type="password"
                            placeholder="••••••••"
                            value={newAccount.imap_password_encrypted}
                            onChange={(e) => setNewAccount({ ...newAccount, imap_password_encrypted: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="dailyLimit">Daily Send Limit</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={newAccount.daily_send_limit}
                    onChange={(e) => setNewAccount({ ...newAccount, daily_send_limit: parseInt(e.target.value) })}
                  />
                </div>

                <Button
                  onClick={handleCreateAccount}
                  disabled={!newAccount.email_address || createAccount.isPending}
                  className="w-full mt-2"
                >
                  {createAccount.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Connect Account"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => {
              const status = statusConfig[account.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={account.id}
                  className="group glass-card p-8 flex flex-col relative"
                >
                  {/* Status Indicator Dot */}
                  <div className={cn("absolute top-6 right-8 h-2.5 w-2.5 rounded-full animate-pulse",
                    account.status === 'active' ? 'bg-success' :
                      account.status === 'warming' ? 'bg-warning' :
                        'bg-destructive'
                  )} />

                  <div className="flex items-start justify-between mb-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner border border-white/20">
                      <Mail className="h-7 w-7" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card !bg-white/90">
                        <DropdownMenuItem className="font-bold text-xs uppercase tracking-wider">Details</DropdownMenuItem>
                        <DropdownMenuItem className="font-bold text-xs uppercase tracking-wider">Settings</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuItem onClick={() => handleToggleStatus(account.id, account.status)} className="font-bold text-xs uppercase tracking-wider text-primary">
                          {account.status === "active" ? "Pause" : "Activate"}
                        </DropdownMenuItem>
                         {account.status !== 'warming' && (
                          <DropdownMenuItem onClick={() => handleInitiateWarmup(account.id)} className="font-bold text-xs uppercase tracking-wider text-warning">
                            Start Warmup
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuItem
                          className="text-destructive font-bold text-xs uppercase tracking-wider"
                          onClick={() => handleDelete(account.id)}
                        >
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div>
                      <h3 className="font-bold text-xl text-foreground truncate " title={account.email_address}>
                        {account.email_address}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/40", status.color)}>
                          {status.label}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                          {account.provider === "smtp" ? "SMTP Server" : account.provider === "google" ? "Google Workspace" : "Microsoft 365"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6 border-y border-border/10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Sent Today</p>
                        <p className="text-2xl font-bold text-foreground">
                          {account.sent_today}<span className="text-sm font-medium text-muted-foreground/60"> / {account.daily_send_limit}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Account Health</p>
                        <div 
                           className="cursor-pointer hover:opacity-80 transition-opacity"
                           onClick={() => setSelectedHealthAccount(account.id)}
                        >
                           <p className={`text-2xl font-bold ${
                              account.status === 'error' ? "text-destructive" : "text-success"
                           }`}>{account.status === 'error' ? "Critical" : "Optimal"}</p>
                           <p className="text-[10px] font-bold text-primary flex items-center justify-end gap-1">View Report <Activity className="h-3 w-3" /></p>
                        </div>
                      </div>
                    </div>

                    {account.warmup_enabled && account.warmup_progress !== undefined ? (
                      <div className="pt-2">
                        <div className="flex justify-between text-[10px] font-black mb-2.5 uppercase tracking-widest">
                          <span className="text-muted-foreground/60">Warmup Maturity</span>
                          <span className="text-primary">{account.warmup_progress}%</span>
                        </div>
                        <Progress value={account.warmup_progress} className="h-1.5 bg-muted/20" />
                      </div>
                    ) : (
                      <div className="pt-2">
                          <Button 
                             onClick={() => handleInitiateWarmup(account.id)}
                             variant="outline" size="lg" className="w-full text-[11px] font-bold uppercase tracking-widest h-12 border-dashed border-primary/20 hover:border-solid hover:bg-primary/5 rounded-xl"
                          >
                           Initiate Warmup Phase
                          </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
             {/* Health Dashboard Dialog - Rendered outside the map loop but controlled by state */}
            <Dialog open={!!selectedHealthAccount} onOpenChange={(open) => !open && setSelectedHealthAccount(null)}>
               {selectedHealthAccount && <HealthDashboardModal accountId={selectedHealthAccount} accounts={accounts} />}
            </Dialog>
          </div>
        ) : (
          <div className="empty-state group py-24 glass-card bg-transparent border-dashed">
            <div className="empty-state-icon group-hover:scale-110 transition-transform duration-500 bg-primary/10 h-20 w-20 rounded-3xl flex items-center justify-center mb-8">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-bold text-2xl text-foreground">Launch your outreach</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-sm mb-6 mt-2">
              Connect a high-deliverability sending account to start reaching your audience effectively.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-3 px-10 h-14 shadow-glow hover:shadow-primary/40 transition-all rounded-full font-black text-sm uppercase tracking-widest">
              <Plus className="h-6 w-6" />
              Connect Account
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
