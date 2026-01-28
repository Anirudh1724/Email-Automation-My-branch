import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSendingAccounts } from "@/hooks/useSendingAccounts";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { useLeadLists } from "@/hooks/useLeadLists";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
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
}

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const { data: sendingAccounts, isLoading: accountsLoading } = useSendingAccounts();
  const { data: leadLists, isLoading: leadListsLoading } = useLeadLists();
  const { data: templates } = useEmailTemplates();
  const createCampaign = useCreateCampaign();

  const [campaignName, setCampaignName] = useState("");
  const [sendingAccountId, setSendingAccountId] = useState("");
  const [leadListId, setLeadListId] = useState("");
  const [dailyLimit, setDailyLimit] = useState("50");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      id: "1",
      variants: [
        {
          id: "v1",
          subject: "",
          body: "",
          weight: 100
        }
      ],
      delayDays: 0,
      delayHours: 0,
    },
  ]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Leads, 2: Accounts, 3: Messaging

  const [variableMenuOpen, setVariableMenuOpen] = useState(false);
  const [variableMenuPosition, setVariableMenuPosition] = useState({ top: 0, left: 0 });
  const [activeVariantTab, setActiveVariantTab] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<{ stepId: string, variantId: string, field: 'subject' | 'body', cursor: number } | null>(null);

  const variables = [
    { label: "First Name", value: "{{first_name}}" },
    { label: "Last Name", value: "{{last_name}}" },
    { label: "Company", value: "{{company}}" },
    { label: "Email", value: "{{email}}" },
  ];

  const addStep = () => {
    const newStep: SequenceStep = {
      id: Date.now().toString(),
      variants: [
        {
          id: `v_${Date.now()}`,
          subject: "",
          body: "",
          weight: 100
        }
      ],
      delayDays: 3,
      delayHours: 0,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== id));
    }
  };

  const updateStep = (id: string, field: keyof SequenceStep, value: any) => {
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step
      )
    );
  };

  const updateVariant = (stepId: string, variantId: string, field: keyof SequenceVariant, value: string | number) => {
    setSteps(steps.map(step => {
      if (step.id !== stepId) return step;
      return {
        ...step,
        variants: step.variants.map(v =>
          v.id === variantId ? { ...v, [field]: value } : v
        )
      };
    }));
  };

  const addVariant = (stepId: string) => {
    setSteps(steps.map(step => {
      if (step.id !== stepId) return step;
      return {
        ...step,
        variants: [
          ...step.variants,
          {
            id: `v_${Date.now()}`,
            subject: "",
            body: "",
            weight: 50 // Default weight, user adjusts
          }
        ]
      };
    }));
  };

  const removeVariant = (stepId: string, variantId: string) => {
    setSteps(steps.map(step => {
      if (step.id !== stepId) return step;
      if (step.variants.length <= 1) return step; // Prevent removing last variant
      return {
        ...step,
        variants: step.variants.filter(v => v.id !== variantId)
      };
    }));
  };

  const handleCaptureCursor = (e: any, stepId: string, variantId: string, field: 'subject' | 'body') => {
    setActiveField({ stepId, variantId, field, cursor: e.target.selectionStart || 0 });
  };

  const handleInsertVariable = (variable: string) => {
    if (!activeField) return;
    const { stepId, variantId, field, cursor } = activeField;

    setSteps(steps.map(step => {
      if (step.id !== stepId) return step;
      return {
        ...step,
        variants: step.variants.map(v => {
          if (v.id !== variantId) return v;
          const currentVal = (v[field] as string) || "";
          const newVal = currentVal.slice(0, cursor) + variable + currentVal.slice(cursor);
          return { ...v, [field]: newVal };
        })
      };
    }));

    // Update cursor position for next insertion
    setActiveField({ ...activeField, cursor: cursor + variable.length });
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

  const handleInsertTemplate = (templateId: string, variantId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template && selectedStepId) {
      updateVariant(selectedStepId, variantId, "subject", template.subject);
      updateVariant(selectedStepId, variantId, "body", template.body);
      setTemplateDialogOpen(false);
      toast.success("Template inserted");
    }
  };

  const handleLaunch = async () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    if (!sendingAccountId) {
      toast.error("Please select a sending account");
      return;
    }

    if (!leadListId) {
      toast.error("Please select a lead list");
      return;
    }

    const invalidStep = steps.find((s) => s.variants.some(v => !v.subject.trim() || !v.body.trim()));
    if (invalidStep) {
      toast.error("All email variants must have a subject and body");
      return;
    }

    try {
      await createCampaign.mutateAsync({
        name: campaignName,
        sending_account_id: sendingAccountId,
        lead_list_id: leadListId,
        status: "active",
        daily_send_limit: parseInt(dailyLimit),
        start_time: startTime,
        end_time: endTime,
        sequences: steps.map((step, index) => ({
          step_number: index + 1,
          subject: step.variants[0].subject, // Primary subject for list view
          body: step.variants[0].body,       // Primary body for list view
          delay_days: step.delayDays,
          delay_hours: step.delayHours,
          is_reply: index > 0,
          variants: step.variants.map(v => ({
            subject: v.subject,
            body: v.body,
            weight: v.weight
          }))
        })),
      });

      toast.success("Campaign launched successfully");
      navigate("/campaigns");
    } catch (error) {
      toast.error("Failed to launch campaign");
    }
  };

  const activeAccounts = sendingAccounts || [];

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col border-b border-border bg-card">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/campaigns")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Campaign Architect</h1>
              <p className="text-sm text-muted-foreground">
                Step {wizardStep} of 3: {wizardStep === 1 ? "Target Leads" : wizardStep === 2 ? "Select Protocol" : "Messaging Blueprint"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {wizardStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setWizardStep(prev => prev - 1)}
                className="rounded-full px-6"
              >
                Previous Step
              </Button>
            )}
            {wizardStep < 3 ? (
              <Button
                onClick={() => {
                  if (wizardStep === 1 && !campaignName.trim()) {
                    toast.error("Please enter a campaign name");
                    return;
                  }
                  if (wizardStep === 1 && !leadListId) {
                    toast.error("Please select a lead list first");
                    return;
                  }
                  if (wizardStep === 2 && !sendingAccountId) {
                    toast.error("Please select a sending account first");
                    return;
                  }
                  setWizardStep(prev => prev + 1);
                }}
                className="rounded-full px-8 shadow-premium"
              >
                Next Step
              </Button>
            ) : (
              <Button
                className="gap-2 rounded-full px-8 shadow-glow hover:shadow-primary/40 transition-all font-black text-sm uppercase tracking-widest h-11"
                onClick={handleLaunch}
                disabled={createCampaign.isPending}
              >
                {createCampaign.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Launch Sequence
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="flex h-1.5 w-full bg-muted/30">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            style={{ width: `${(wizardStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-8">
        {wizardStep === 1 && (
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

        {wizardStep === 2 && (
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
                  ) : activeAccounts.length === 0 ? (
                    <div className="h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center px-4 gap-3">
                      <span className="text-sm text-amber-700">No sending accounts found.</span>
                      <a href="/accounts" className="text-sm font-bold text-primary hover:underline">Add one first →</a>
                    </div>
                  ) : (
                    <Select value={sendingAccountId} onValueChange={setSendingAccountId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/50 border-white/20 text-base font-semibold">
                        <SelectValue placeholder="Select sender account" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {activeAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id} className="font-semibold">
                            {account.display_name || account.email_address} ({account.email_address})
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

        {wizardStep === 3 && (
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
                            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${(activeVariantTab[step.id] === variant.id || (!activeVariantTab[step.id] && vIndex === 0))
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
                                onChange={(e) => updateVariant(step.id, variant.id, "subject", e.target.value)}
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
                                onChange={(e) => updateVariant(step.id, variant.id, "body", e.target.value)}
                                onBlur={(e) => handleCaptureCursor(e, step.id, variant.id, 'body')}
                                onKeyDown={(e) => handleKeyDown(e, step.id, variant.id, 'body')}
                                className="bg-white/50 border-white/20 resize-none focus:bg-white/80 transition-all font-medium"
                              />
                            </div>
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
                                          onClick={() => handleInsertTemplate(template.id, variant.id)}
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
                          </div>
                        )
                      })}
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
