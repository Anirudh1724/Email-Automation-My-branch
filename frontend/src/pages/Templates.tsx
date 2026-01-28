import { useState } from "react";
import { Plus, Search, MoreHorizontal, FileText, Copy, Trash2, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEmailTemplates, useCreateEmailTemplate, useDeleteEmailTemplate } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";

export default function Templates() {
  const { data: templates, isLoading } = useEmailTemplates();
  const createTemplate = useCreateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body: "",
  });

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error("Please fill in all fields");
      return;
    }

    await createTemplate.mutateAsync({
      name: newTemplate.name,
      subject: newTemplate.subject,
      body: newTemplate.body,
    });

    setIsDialogOpen(false);
    setNewTemplate({ name: "", subject: "", body: "" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await deleteTemplate.mutateAsync(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Templates"
        description="Create and manage reusable email templates"
        backUrl="/dashboard"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
                <DialogDescription>
                  Create a reusable email template with merge fields.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Initial Outreach"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Quick question about {{company}}"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{firstName}}"}, {"{{lastName}}"}, {"{{company}}"}, etc.
                    for personalization
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Write your email content here..."
                    rows={8}
                    value={newTemplate.body}
                    onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createTemplate.isPending}
                  className="w-full"
                >
                  {createTemplate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Template"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-8">
        {/* Search */}
        <div className="mb-10 flex items-center justify-between">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Search your sequence assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-background/50 backdrop-blur-xl border-border/10 rounded-2xl focus:bg-background transition-all shadow-inner text-base font-medium dark:bg-slate-900/50 dark:border-white/5"
            />
          </div>
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full glass-card border border-white/40 text-[10px] font-black uppercase tracking-widest text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {filteredTemplates.length} Assets Found
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group glass-card p-8 flex flex-col relative"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner border border-white/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card !bg-white/90">
                      <DropdownMenuItem className="font-bold text-xs uppercase tracking-wider">Modify Asset</DropdownMenuItem>
                      <DropdownMenuItem className="font-bold text-xs uppercase tracking-wider">
                        <Copy className="mr-2 h-4 w-4" />
                        Clone
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/10" />
                      <DropdownMenuItem
                        className="text-destructive font-bold text-xs uppercase tracking-wider"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Permanently Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Subject Preview</p>
                    <p className="text-sm font-bold text-foreground line-clamp-1 opacity-80 italic">
                      "{template.subject}"
                    </p>
                  </div>
                  <div className="relative rounded-2xl bg-muted/20 p-6 min-h-[120px] group-hover:bg-muted/30 transition-all border border-border/5">
                    <p className="text-sm text-foreground/70 line-clamp-4 leading-relaxed font-medium">
                      {template.body}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-border/5 pt-6">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Deployed {template.usage_count}x
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {formatDate(template.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state group py-24 glass-card bg-transparent border-dashed">
            <div className="empty-state-icon group-hover:scale-110 transition-transform duration-500 bg-primary/10 h-20 w-20 rounded-3xl flex items-center justify-center mb-8">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-bold text-2xl text-foreground">Centralize your messaging</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-sm mb-6 mt-2">
              Blueprint your high-converting steps once and reuse them across any sequence.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-3 px-10 h-14 shadow-glow hover:shadow-primary/40 transition-all rounded-full font-black text-sm uppercase tracking-widest">
              <Plus className="h-6 w-6" />
              New Asset
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
