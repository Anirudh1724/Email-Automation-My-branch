import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Mail,
  Send,
  Loader2,
  FileText,
  List,
  Play,
  Pause,
  Copy,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSendingAccounts } from "@/hooks/useSendingAccounts";
import { useCampaign, useUpdateCampaign, useUpdateCampaignStatus, useDeleteCampaign, useCreateCampaign } from "@/hooks/useCampaigns";
import { useLeadLists } from "@/hooks/useLeadLists";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SequenceVariant {
  id: string;
  subject: string;
  body: string;
  weight: number;
}

interface SequenceStep {
  id: string;
  variants: SequenceVariant[];
  delayDays: number;
  delayHours: number;
  isNew?: boolean;
}

export default function CampaignEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading: campaignLoading } = useCampaign(id!);
  const { data: sendingAccounts, isLoading: accountsLoading } = useSendingAccounts();
  const { data: leadLists, isLoading: leadListsLoading } = useLeadLists();
  const { data: templates } = useEmailTemplates();
  const updateCampaign = useUpdateCampaign();
  const updateStatus = useUpdateCampaignStatus();
  const deleteCampaign = useDeleteCampaign();
  const createCampaign = useCreateCampaign();

  const [campaignName, setCampaignName] = useState("");
  const [sendingAccountId, setSendingAccountId] = useState("");
  const [leadListId, setLeadListId] = useState("");
  const [dailyLimit, setDailyLimit] = useState("50");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "settings" | "messaging">("leads");

  const [variableMenuOpen, setVariableMenuOpen] = useState(false);
  const [variableMenuPosition, setVariableMenuPosition] = useState({ top: 0, left: 0 });
  const [activeField, setActiveField] = useState<{ stepId: string, variantId: string, field: 'subject' | 'body', cursor: number } | null>(null);
  const [activeVariantTab, setActiveVariantTab] = useState<Record<string, string>>({});

  const variables = [
    { label: "First Name", value: "{{first_name}}" },
    { label: "Last Name", value: "{{last_name}}" },
    { label: "Company", value: "{{company}}" },
    { label: "Email", value: "{{email}}" },
  ];

  // Load campaign data when it's fetched
  useEffect(() => {
    if (campaign && !isSaving) {
      console.log("Loading campaign data into state:", campaign.name);
      setCampaignName(campaign.name);
      setSendingAccountId(campaign.sending_account_id || "");
      setLeadListId(campaign.lead_list_id || "");
      setDailyLimit(String(campaign.daily_send_limit || 50));
      setStartTime(campaign.start_time || "09:00");
      setEndTime(campaign.end_time || "18:00");

      if (campaign.sequences && campaign.sequences.length > 0) {
        const sortedSequences = [...campaign.sequences].sort((a, b) => a.step_number - b.step_number);
        setSteps(
          sortedSequences.map((seq) => ({
            id: seq.id,
            variants: (seq.variants && seq.variants.length > 0)
              ? seq.variants.map(v => ({ id: v.id, subject: v.subject, body: v.body, weight: v.weight }))
              : [{ id: "default", subject: seq.subject, body: seq.body, weight: 100 }],
            delayDays: seq.delay_days || 0,
            delayHours: seq.delay_hours || 0,
          }))
        );
      } else {
        setSteps([
          { 
            id: "new-1", 
            variants: [{ id: "v1", subject: "", body: "", weight: 100 }],
            delayDays: 0, 
            delayHours: 0, 
            isNew: true 
          },
        ]);
      }
    }
  }, [campaign, isSaving, id]);

  const addStep = () => {
    const newStep: SequenceStep = {
      id: `new-${Date.now()}`,
      variants: [{ id: `v-${Date.now()}`, subject: "", body: "", weight: 100 }],
      delayDays: 3,
      delayHours: 0,
      isNew: true,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== stepId));
    }
  };

  const addVariant = (stepId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        const newVariantId = `v-${Date.now()}`;
        const newVariant = { id: newVariantId, subject: "", body: "", weight: 50 };
        // Determine existing variants to auto-select new one if needed, or just add it
        return { ...step, variants: [...step.variants, newVariant] };
      }
      return step;
    }));
  };

  const removeVariant = (stepId: string, variantId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId && step.variants.length > 1) {
        return { ...step, variants: step.variants.filter(v => v.id !== variantId) };
      }
      return step;
    }));
  };

  const updateStep = (stepId: string, field: keyof SequenceStep | 'subject' | 'body', value: string | number, variantId?: string) => {
    setSteps(
      steps.map((step) => {
        if (step.id === stepId) {
          if (variantId && (field === 'subject' || field === 'body')) {
            return {
              ...step,
              variants: step.variants.map(v => v.id === variantId ? { ...v, [field]: value } : v)
            };
          }
          if (field !== 'subject' && field !== 'body') {
             // @ts-ignore
             return { ...step, [field]: value };
          }
        }
        return step;
      })
    );
  };

  const handleCaptureCursor = (e: any, stepId: string, variantId: string, field: 'subject' | 'body') => {
    setActiveField({ stepId, variantId, field, cursor: e.target.selectionStart || 0 });
  };

  const handleInsertVariable = (variable: string) => {
    if (!activeField) return;
    const { stepId, variantId, field, cursor } = activeField;
    const step = steps.find(s => s.id === stepId);
    if (step) {
      const variant = step.variants.find(v => v.id === variantId);
      if (variant) {
          const currentVal = variant[field] || "";
          const newVal = currentVal.slice(0, cursor) + variable + currentVal.slice(cursor);
          updateStep(stepId, field, newVal, variantId);
          // Update cursor position for next insertion
          setActiveField({ ...activeField, cursor: cursor + variable.length });
      }
    }
    setVariableMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, stepId: string, variantId: string, field: 'subject' | 'body') => {
    const target = e.target as HTMLTextAreaElement | HTMLInputElement;
    const cursorPosition = target.selectionStart || 0;
    const textBeforeCursor = target.value.slice(0, cursorPosition);

    if (e.key === '{' && textBeforeCursor.endsWith('{')) {
      const rect = target.getBoundingClientRect();
      setVariableMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setActiveField({ stepId, variantId, field, cursor: cursorPosition });
      setVariableMenuOpen(true);
    }
  };

  const handleInsertTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template && selectedStepId) {
        // Need to know which variant is active to insert template into that one. 
        // For simplicity, inserting into the first variant or active tab if we tracked it better.
        // Assuming user acts on the 'active' variant.
        const activeVariantId =  activeVariantTab[selectedStepId] || steps.find(s => s.id === selectedStepId)?.variants[0].id;
        if (activeVariantId) {
             updateStep(selectedStepId, "subject", template.subject, activeVariantId);
             updateStep(selectedStepId, "body", template.body, activeVariantId);
             setTemplateDialogOpen(false);
             toast.success("Template inserted");
        }
    }
  };

  const handleSave = async () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    const invalidStep = steps.find((s, i) => s.variants.some(v => !v.subject.trim() || !v.body.trim()));
    if (invalidStep) {
      const stepIndex = steps.indexOf(invalidStep) + 1;
      toast.error(`Step ${stepIndex} has incomplete variants`);
      return;
    }

    setIsSaving(true);
    try {
      const { error: campaignError } = await supabase
        .from("campaigns")
        .update({
          name: campaignName,
          sending_account_id: sendingAccountId || null,
          lead_list_id: leadListId || null,
          daily_send_limit: parseInt(dailyLimit) || 50,
          start_time: startTime,
          end_time: endTime,
        })
        .eq("id", id!);

      if (campaignError) throw campaignError;

      if (leadListId) {
        // @ts-ignore
        const { error: syncError } = await supabase.rpc('sync_campaign_leads', {
          _campaign_id: id!,
          _lead_list_id: leadListId
        });
        if (syncError) console.error("Sync leads error:", syncError);
      }

      const sequencesToInsert = steps.map((step, index) => ({
        step_number: index + 1,
        subject: step.variants[0].subject, // Backward compatibility for main subject
        body: step.variants[0].body,     // Backward compatibility for main body
        delay_days: step.delayDays || 0,
        delay_hours: step.delayHours || 0,
        is_reply: index > 0,
        variants: step.variants.map(v => ({
            subject: v.subject,
            body: v.body,
            weight: v.weight
        }))
      }));

      // @ts-ignore
      const { error: seqError } = await supabase.rpc('update_campaign_sequence', {
        _campaign_id: id!,
        _steps: sequencesToInsert
      });

      if (seqError) throw seqError;

      await queryClient.removeQueries({ queryKey: ["campaigns", id] });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });

      toast.success("Campaign updated successfully");
      navigate(`/campaigns/${id}`);
    } catch (error: any) {
      toast.error(`Failed to update campaign: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeAccounts = sendingAccounts?.filter((a) => a.status === "active") || [];

  if (campaignLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">Campaign not found</p>
          <Button variant="link" onClick={() => navigate("/campaigns")}>
            Back to campaigns
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col border-b border-border bg-card">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/campaigns/${id}`)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Campaign Architect</h1>
              <p className="text-sm text-muted-foreground">
                Manage your campaign settings and sequences
              </p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-muted/30 p-1 rounded-full border border-white/5">
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "leads"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              Target Leads
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "settings"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              Protocol
            </button>
            <button
              onClick={() => setActiveTab("messaging")}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "messaging"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              Messaging
            </button>
          </div>

          <div className="flex items-center gap-3">
             {/* Header Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-full border-white/10 bg-white/5 hover:bg-white/10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-white/10 min-w-[200px]">
                <DropdownMenuItem 
                  onClick={() => {
                    if (campaign?.status === 'active') {
                       updateStatus.mutate({ id: id!, status: 'paused' });
                    } else {
                       updateStatus.mutate({ id: id!, status: 'active' });
                    }
                  }}
                  className="gap-2 p-3 font-semibold focus:bg-white/10 cursor-pointer"
                >
                  {campaign?.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {campaign?.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                   onClick={() => {
                      if (!campaign) return;
                      createCampaign.mutate({
                        ...campaign,
                        name: `${campaign.name} (Copy)`,
                        status: 'draft',
                        sequences: steps.map((step, idx) => ({
                           step_number: idx + 1,
                           subject: step.variants[0].subject,
                           body: step.variants[0].body,
                           delay_days: step.delayDays,
                           delay_hours: step.delayHours,
                           is_reply: idx > 0,
                           variants: step.variants.map(v => ({ subject: v.subject, body: v.body, weight: v.weight }))
                        }))
                      });
                   }}
                   className="gap-2 p-3 font-semibold focus:bg-white/10 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  Clone Campaign
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2 p-3 font-semibold text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              className="gap-2 rounded-full px-8 shadow-glow hover:shadow-primary/40 transition-all font-black text-sm uppercase tracking-widest h-11"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-card border-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Campaign?
            </DialogTitle>
             <CardDescription className="text-muted-foreground mt-2">
              Are you sure you want to delete "{campaignName}"? This action cannot be undone.
            </CardDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              variant="destructive" 
              className="rounded-xl shadow-lg shadow-destructive/20"
              onClick={() => {
                deleteCampaign.mutate(id!);
                navigate("/campaigns");
              }}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-8">
        {activeTab === "leads" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass-card border-none overflow-hidden p-8">
              <CardHeader className="p-0 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 border border-white/20 shadow-inner">
                  <List className="h-7 w-7" />
                </div>
                <CardTitle className="text-3xl font-black">Identify Targets</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-2">Which lead list should this campaign engage?</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-8">
                <div className="grid gap-3">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Campaign Label</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Enterprise Q1 Outreach"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="h-14 rounded-2xl bg-white/50 border-white/20 text-base font-semibold"
                  />
                </div>

                <div className="grid gap-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Lead List</Label>
                  {leadListsLoading ? (
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  ) : (
                    <Select value={leadListId} onValueChange={setLeadListId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/50 border-white/20 text-base font-semibold">
                        <SelectValue placeholder="Identify target list" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {leadLists?.map((list) => (
                          <SelectItem key={list.id} value={list.id} className="font-semibold">
                            {list.name} <span className="text-muted-foreground opacity-50 ml-2">({list.lead_count} leads)</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass-card border-none overflow-hidden p-8">
              <CardHeader className="p-0 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 border border-white/20 shadow-inner">
                  <Send className="h-7 w-7" />
                </div>
                <CardTitle className="text-3xl font-black">Sending Protocol</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-2">Select the vessel for your outgoing communications</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-8">
                <div className="grid gap-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dispatch Account</Label>
                  {accountsLoading ? (
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  ) : (
                    <Select value={sendingAccountId} onValueChange={setSendingAccountId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/50 border-white/20 text-base font-semibold">
                        <SelectValue placeholder="Identify sender" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {activeAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id} className="font-semibold">
                            {account.email_address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="grid gap-3">
                    <Label htmlFor="dailyLimit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Daily Frequency</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(e.target.value)}
                      className="h-14 rounded-2xl bg-white/50 border-white/20 text-base font-semibold"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Time Window</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="h-12 rounded-xl bg-white/50 border-white/10"
                      />
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="h-12 rounded-xl bg-white/50 border-white/10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "messaging" && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-foreground">Sequence Blueprint</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Design the timing and content of your touchpoints</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-primary/20 hover:bg-primary/5 transition-all font-bold px-6 h-11"
                onClick={addStep}
              >
                <Plus className="h-4 w-4" />
                Add New Phase
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="sequence-step group">
                  <div className="sequence-step-number !bg-primary/10 !text-primary !border-primary/20 shadow-sm">{index + 1}</div>
                  <Card className="flex-1 glass-card border-none overflow-hidden hover:translate-y-0 shadow-lg group-hover:shadow-primary/5 transition-all">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <GripVertical className="h-5 w-5 text-muted-foreground/20 cursor-grab hover:text-primary/50 transition-all" />
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner border border-white/20">
                              <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold">
                                {index === 0 ? "Initial Launch" : `Follow-up Phase ${index}`}
                              </CardTitle>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none mt-1">
                                {index === 0 ? "Entry protocol" : `Timed response sequence`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {index > 0 && (
                            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 border border-white/20 px-4 py-2 shadow-inner">
                              <Clock className="h-4 w-4 text-primary/70" />
                              <span className="text-xs font-bold text-muted-foreground">Wait</span>
                              <Input
                                type="number"
                                value={step.delayDays}
                                onChange={(e) =>
                                  updateStep(step.id, "delayDays", parseInt(e.target.value) || 0)
                                }
                                className="w-14 h-8 text-center bg-white/50 border-none rounded-lg font-black text-primary"
                              />
                              <span className="text-xs font-bold text-muted-foreground">days</span>
                            </div>
                          )}
                          {steps.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                              onClick={() => removeStep(step.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 mb-6 bg-muted/30 p-1.5 rounded-2xl w-fit border border-white/5">
                            {step.variants.map((variant, vIndex) => (
                                <Button
                                    key={variant.id}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveVariantTab({ ...activeVariantTab, [step.id]: variant.id })}
                                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                                        (activeVariantTab[step.id] === variant.id || (!activeVariantTab[step.id] && vIndex === 0))
                                            ? "bg-white shadow-sm text-primary ring-1 ring-black/5" 
                                            : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                                    }`}
                                >
                                    Variant {String.fromCharCode(65 + vIndex)}
                                </Button>
                            ))}
                             {step.variants.length < 5 && (
                                <Button
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => addVariant(step.id)}
                                    className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all gap-1.5 border border-dashed border-primary/20 hover:border-primary/50"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Variant
                                </Button>
                            )}
                        </div>

                        {step.variants.map((variant, vIndex) => {
                             if (activeVariantTab[step.id] !== variant.id && !(!activeVariantTab[step.id] && vIndex === 0)) return null;
                             
                             return (
                                <div key={variant.id} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                   <div className="flex justify-between items-center">
                                        <Label className="text-xs text-muted-foreground">Variant Configuration</Label>
                                        {step.variants.length > 1 && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => removeVariant(step.id, variant.id)}
                                                className="h-6 text-destructive hover:bg-destructive/10 text-[10px]"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" /> Remove Variant
                                            </Button>
                                        )}
                                   </div>
                                  <div className="grid gap-2">
                                    <Label>Subject Line</Label>
                                    <Input
                                      placeholder={
                                        index === 0
                                          ? "e.g., Quick question about {{company}}"
                                          : "Re: Quick question about {{company}}"
                                      }
                                      value={variant.subject}
                                      onChange={(e) => updateStep(step.id, "subject", e.target.value, variant.id)}
                                      onBlur={(e) => handleCaptureCursor(e, step.id, variant.id, 'subject')}
                                      onKeyDown={(e) => handleKeyDown(e, step.id, variant.id, 'subject')}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                      <Label>Email Body</Label>
                                      <div className="flex gap-1.5">
                                        {variables.map((v) => (
                                          <Button
                                            key={v.value}
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-[10px] font-black uppercase tracking-tight rounded-lg border-primary/10 hover:bg-primary/5 transition-all focus:ring-0 focus:ring-offset-0"
                                            onClick={() => {
                                              if (!activeField || activeField.stepId !== step.id || activeField.variantId !== variant.id || activeField.field !== 'body') {
                                                setActiveField({ stepId: step.id, variantId: variant.id, field: 'body', cursor: variant.body.length });
                                              }
                                              setTimeout(() => handleInsertVariable(v.value), 0);
                                            }}
                                          >
                                            {v.label.split(' ')[0]}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                    <Textarea
                                      placeholder="Write your email content here..."
                                      rows={6}
                                      value={variant.body}
                                      onChange={(e) => updateStep(step.id, "body", e.target.value, variant.id)}
                                      onBlur={(e) => handleCaptureCursor(e, step.id, variant.id, 'body')}
                                      onKeyDown={(e) => handleKeyDown(e, step.id, variant.id, 'body')}
                                      className="bg-white/50 border-white/20 resize-none focus:bg-white/80 transition-all font-medium"
                                    />
                                  </div>
                                </div>
                             )
                        })}
                       
                      <div className="flex gap-2">
                        <Dialog open={templateDialogOpen && selectedStepId === step.id} onOpenChange={(open) => {
                          setTemplateDialogOpen(open);
                          if (open) setSelectedStepId(step.id);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 rounded-xl h-10 border-white/20 bg-white/50 hover:bg-white/80 transition-all font-bold">
                              <FileText className="h-4 w-4" />
                              Insert Template
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card border-none">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black">Select Template</DialogTitle>
                            </DialogHeader>
                            {templates && templates.length > 0 ? (
                              <div className="space-y-2 max-h-80 overflow-auto pr-2">
                                {templates.map((template) => (
                                  <button
                                    key={template.id}
                                    onClick={() => handleInsertTemplate(template.id)}
                                    className="w-full text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all group"
                                  >
                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{template.name}</p>
                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                      {template.subject}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground py-10 text-center font-medium">
                                No templates available.{" "}
                                <a href="/templates" className="text-primary hover:underline font-bold">
                                  Create one first
                                </a>
                              </p>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-2xl h-16 text-primary font-black uppercase tracking-widest transition-all"
              onClick={addStep}
            >
              <Plus className="h-5 w-5" />
              Add Sequence Phase
            </Button>
          </div>
        )}
      </div>

      {variableMenuOpen && (
        <div
          className="fixed z-[100] w-48 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-2xl text-popover-foreground shadow-premium outline-none animate-in fade-in-0 zoom-in-95"
          style={{
            top: Math.min(variableMenuPosition.top, window.innerHeight - 200),
            left: Math.min(variableMenuPosition.left, window.innerWidth - 200)
          }}
        >
          <div className="p-2">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Insert Variable</p>
            <div className="space-y-1">
              {variables.map((v) => (
                <button
                  key={v.value}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-bold text-foreground transition-all hover:bg-primary/10 hover:text-primary outline-none"
                  onClick={() => handleInsertVariable(v.value)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setVariableMenuOpen(false)}
          />
        </div>
      )}
    </AppLayout>
  );
}
