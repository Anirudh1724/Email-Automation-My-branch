import { useState, useRef, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Upload,
  MoreHorizontal,
  Mail,
  Trash2,
  UserX,
  Loader2,
  FolderPlus,
  List,
  RefreshCw,
  ExternalLink,
  Calendar,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLeads, useCreateLead, useDeleteLead, useDeleteLeadsBulk, useCreateLeadsBulk, useUpdateLead } from "@/hooks/useLeads";
import { useLeadLists, useCreateLeadList, useDeleteLeadList, useUpdateLeadList } from "@/hooks/useLeadLists";
import { useCampaigns } from "@/hooks/useCampaigns";
import { LeadStatus } from "@/types/database";
import { toast } from "sonner";

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-primary/10 text-primary" },
  sent: { label: "Sent", color: "bg-chart-1/10 text-chart-1" },
  opened: { label: "Opened", color: "bg-success/10 text-success" },
  replied: { label: "Replied", color: "bg-chart-4/10 text-chart-4" },
  bounced: { label: "Bounced", color: "bg-destructive/10 text-destructive" },
  unsubscribed: { label: "Unsubscribed", color: "bg-muted text-muted-foreground" },
  completed: { label: "Completed", color: "bg-chart-4/10 text-chart-4" },
};

export default function Leads() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: leads, isLoading } = useLeads(undefined, selectedListId || undefined);
  const { data: leadLists, isLoading: listsLoading } = useLeadLists();
  const { data: campaigns } = useCampaigns();
  const createLead = useCreateLead();
  const createLeadsBulk = useCreateLeadsBulk();
  const deleteLead = useDeleteLead();
  const deleteLeadsBulk = useDeleteLeadsBulk();
  const createLeadList = useCreateLeadList();
  const deleteLeadList = useDeleteLeadList();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [importCampaignId, setImportCampaignId] = useState("");
  const [importLeadListId, setImportLeadListId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<any>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [isEditLeadDialogOpen, setIsEditLeadDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<any>(null);
  const [isEditListDialogOpen, setIsEditListDialogOpen] = useState(false);
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | "">("");

  const updateLead = useUpdateLead();
  const updateLeadList = useUpdateLeadList();

  const [newLead, setNewLead] = useState({
    campaign_id: "",
    lead_list_id: "",
    email: "",
    first_name: "",
    last_name: "",
    company: "",
  });

  const [newList, setNewList] = useState({
    name: "",
    description: "",
  });

  const selectedList = leadLists?.find(l => l.id === selectedListId);

  const filteredLeads = useMemo(() => {
    return leads?.filter((lead) => {
      const matchesSearch =
        (lead.first_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (lead.last_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.company?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [leads, searchQuery, statusFilter]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLeads.slice(startIndex, startIndex + pageSize);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize);

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((lead) => lead.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateLead = async () => {
    const email = newLead.email?.trim();
    const firstName = newLead.first_name?.trim();
    const lastName = newLead.last_name?.trim();
    const leadListId = newLead.lead_list_id || selectedListId;

    if (!leadListId) {
      toast.error("No lead list selected");
      return;
    }
    if (!email) {
      toast.error("Email is required");
      return;
    }
    if (!firstName) {
      toast.error("First name is required");
      return;
    }
    if (!lastName) {
      toast.error("Last name is required");
      return;
    }

    await createLead.mutateAsync({
      lead_list_id: leadListId,
      campaign_id: newLead.campaign_id || undefined,
      email: email,
      first_name: firstName,
      last_name: lastName,
      company: newLead.company?.trim() || undefined,
    });

    setIsAddDialogOpen(false);
    setNewLead({ campaign_id: "", lead_list_id: "", email: "", first_name: "", last_name: "", company: "" });
  };

  const handleCreateLeadList = async () => {
    if (!newList.name.trim()) {
      toast.error("List name is required");
      return;
    }

    await createLeadList.mutateAsync({
      name: newList.name,
      description: newList.description || undefined,
    });

    setIsListDialogOpen(false);
    setNewList({ name: "", description: "" });
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) return;
    if (!confirm(`Delete ${selectedLeads.length} lead(s)?`)) return;

    await deleteLeadsBulk.mutateAsync(selectedLeads);
    setSelectedLeads([]);
  };

  const handleUpdateLead = async () => {
    if (!editingLead) return;
    await updateLead.mutateAsync({
      id: editingLead.id,
      updates: {
        email: editingLead.email,
        first_name: editingLead.first_name,
        last_name: editingLead.last_name,
        company: editingLead.company,
        status: editingLead.status,
      },
    });
    setIsEditLeadDialogOpen(false);
    setEditingLead(null);
  };

  const handleUpdateLeadList = async () => {
    if (!editingList) return;
    await updateLeadList.mutateAsync({
      id: editingList.id,
      updates: {
        name: editingList.name,
        description: editingList.description,
      },
    });
    setIsEditListDialogOpen(false);
    setEditingList(null);
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedLeads.length === 0) return;

    // We update each lead. In a real app, a bulk update endpoint would be better.
    // But for now we use what we have.
    const promises = selectedLeads.map(id =>
      updateLead.mutateAsync({ id, updates: { status: bulkStatus } })
    );

    try {
      await Promise.all(promises);
      toast.success(`Updated ${selectedLeads.length} leads to ${bulkStatus}`);
      setSelectedLeads([]);
      setIsBulkStatusDialogOpen(false);
      setBulkStatus("");
    } catch (error) {
      toast.error("Failed to update some leads");
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await deleteLead.mutateAsync(id);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importLeadListId) {
      toast.error("Please select a lead list first");
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      // Better CSV regex that handles quotes containing commas
      const parseCSVLine = (line: string) => {
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        return values;
      };

      const lines = text.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        toast.error("CSV file must have headers and at least one data row");
        return;
      }

      const rawHeaders = parseCSVLine(lines[0]);
      const normalizedHeaders = rawHeaders.map(h => h.toLowerCase().replace(/[\s_-]/g, ''));

      const emailIndex = normalizedHeaders.findIndex(h => h === 'email' || h === 'emailaddress');

      // Fuzzy match name fields
      let firstNameIndex = normalizedHeaders.findIndex(h => h.includes('firstname') || h === 'first' || h === 'fname');
      let lastNameIndex = normalizedHeaders.findIndex(h => h.includes('lastname') || h === 'last' || h === 'lname');

      // Fallback: Check for "Name" or "Full Name" if first/last aren't found
      const nameIndex = normalizedHeaders.findIndex(h => h === 'name' || h === 'fullname');

      const companyIndex = normalizedHeaders.findIndex(h => h === 'company' || h === 'companyname' || h === 'organization');

      if (emailIndex === -1) {
        toast.error("CSV must have an 'Email' column");
        return;
      }

      const leadsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        // Skip empty lines or lines with mismatched columns (basic check)
        if (values.length < 1) continue;

        const email = values[emailIndex];

        if (email && email.includes('@')) {
          let firstName = firstNameIndex >= 0 ? values[firstNameIndex] : undefined;
          let lastName = lastNameIndex >= 0 ? values[lastNameIndex] : undefined;

          // Split full name if individual fields missing
          if (!firstName && !lastName && nameIndex >= 0 && values[nameIndex]) {
            const parts = values[nameIndex].split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
          }

          const company = companyIndex >= 0 ? values[companyIndex] : undefined;

          // Collect all extra columns as custom fields
          const custom_fields: Record<string, string> = {};
          rawHeaders.forEach((header, index) => {
            if (
              index !== emailIndex &&
              index !== firstNameIndex &&
              index !== lastNameIndex &&
              index !== nameIndex &&
              index !== companyIndex &&
              values[index]
            ) {
              custom_fields[header] = values[index];
            }
          });

          leadsToImport.push({
            email,
            first_name: firstName || "",
            last_name: lastName || "",
            company: company || "",
            custom_fields,
          });
        }
      }

      if (leadsToImport.length === 0) {
        toast.error("No valid leads found in CSV");
        return;
      }

      await createLeadsBulk.mutateAsync({
        leadListId: importLeadListId,
        campaignId: importCampaignId || undefined,
        leads: leadsToImport,
      });

      setIsImportDialogOpen(false);
      setImportCampaignId("");
      setImportLeadListId("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(`Failed to import: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title={selectedList ? selectedList.name : "Lead Lists"}
        description={selectedList ? selectedList.description || "Manage leads in this list" : "Manage your lead lists and contacts"}
        actions={
          <div className="flex items-center gap-3">
            {selectedList ? (
              <>
                <Button variant="outline" onClick={() => setSelectedListId(null)}>
                  Back to Lists
                </Button>
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2" onClick={() => {
                      setImportLeadListId(selectedListId || "");
                    }}>
                      <Upload className="h-4 w-4" />
                      Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Import Leads</DialogTitle>
                      <DialogDescription>
                        Upload a CSV file to import leads into {selectedList.name}.
                      </DialogDescription>
                    </DialogHeader>
                    {/* Import Dialog Content - Simplified for context */}
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Target Campaign</Label>
                        <Select value={importCampaignId} onValueChange={setImportCampaignId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaigns?.map((campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id}>
                                {campaign.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Hidden Lead List Select since it's fixed */}
                      <div
                        className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isImporting ? (
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        )}
                        <p className="mt-2 text-sm font-medium">
                          {isImporting ? "Importing..." : "Drop your CSV file here"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or click to browse
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isImporting}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        CSV must include: email, first_name, last_name, company columns
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => {
                      setNewLead(prev => ({ ...prev, lead_list_id: selectedListId || "" }));
                    }}>
                      <Plus className="h-4 w-4" />
                      Add Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Lead</DialogTitle>
                      <DialogDescription>
                        Add a new lead to {selectedList.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Add Lead Form - Simplified */}
                      <div className="grid gap-2">
                        <Label>Campaign</Label>
                        <Select
                          value={newLead.campaign_id}
                          onValueChange={(value) => setNewLead({ ...newLead, campaign_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaigns?.map((campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id}>
                                {campaign.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="lead@company.com"
                          value={newLead.email}
                          onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="John"
                            value={newLead.first_name}
                            onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
                            value={newLead.last_name}
                            onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          placeholder="Acme Inc"
                          value={newLead.company}
                          onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                        />
                      </div>
                      <Button
                        onClick={handleCreateLead}
                        disabled={createLead.isPending}
                        className="w-full"
                      >
                        {createLead.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Add Lead"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingList(selectedList);
                      setIsEditListDialogOpen(true);
                    }}>
                      Edit List Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive font-medium"
                      onClick={() => {
                        if (confirm(`Delete list "${selectedList.name}"? Leads will NOT be deleted from the database, only removed from this list view.`)) {
                          deleteLeadList.mutate(selectedList.id);
                          setSelectedListId(null);
                        }
                      }}
                    >
                      Delete List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <FolderPlus className="h-4 w-4" />
                    New List
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Lead List</DialogTitle>
                    <DialogDescription>
                      Create a new list to organize your leads.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="listName">List Name</Label>
                      <Input
                        id="listName"
                        placeholder="e.g., Q1 Prospects"
                        value={newList.name}
                        onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="listDescription">Description (optional)</Label>
                      <Input
                        id="listDescription"
                        placeholder="Description of this list"
                        value={newList.description}
                        onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleCreateLeadList}
                      disabled={createLeadList.isPending}
                      className="w-full"
                    >
                      {createLeadList.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create List"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      <div className="p-8">
        {!selectedListId ? (
          // List View
          listsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : leadLists && leadLists.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {leadLists.map((list, index) => {
                // Generate a deterministic gradient based on index or name
                const gradients = [
                  "from-blue-500/10 to-cyan-500/5 border-blue-500/20",
                  "from-violet-500/10 to-purple-500/5 border-violet-500/20",
                  "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
                  "from-amber-500/10 to-orange-500/5 border-amber-500/20",
                  "from-rose-500/10 to-pink-500/5 border-rose-500/20",
                ];
                const gradientClass = gradients[index % gradients.length];
                const iconColors = [
                  "text-blue-500",
                  "text-violet-500",
                  "text-emerald-500",
                  "text-amber-500",
                  "text-rose-500",
                ];
                const iconColor = iconColors[index % iconColors.length];

                return (
                  <div
                    key={list.id}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border bg-card p-0 transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer",
                      "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-[0.03] before:transition-opacity group-hover:before:opacity-[0.08]",
                      list.lead_count > 0 ? "border-primary/20" : "border-muted"
                    )}
                    onClick={() => setSelectedListId(list.id)}
                  >
                    <div className={cn("h-2 w-full bg-gradient-to-r",
                      index % 3 === 0 ? "from-blue-500 to-cyan-400" :
                        index % 3 === 1 ? "from-violet-500 to-purple-400" :
                          "from-emerald-500 to-teal-400"
                    )} />

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm border border-border/50", iconColor)}>
                          <List className="h-6 w-6" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setEditingList(list);
                              setIsEditListDialogOpen(true);
                            }}>Edit List</DropdownMenuItem>
                            <DropdownMenuItem>Export Leads</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this list? Leads will not be deleted.")) {
                                  deleteLeadList.mutate(list.id);
                                }
                              }}
                            >
                              Delete List
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {list.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 min-h-[2.5rem]">
                          {list.description || "No description provided"}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex flex-col">
                            <span className="text-2xl font-black text-foreground tabular-nums">
                              {list.lead_count.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">leads</span>
                          </div>
                          <Button variant="ghost" size="sm" className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            View List
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FolderPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">No lead lists</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create your first lead list to organize your contacts.
              </p>
              <Button onClick={() => setIsListDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create List
              </Button>
            </div>
          )
        ) : (
          // Leads in List View
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              {selectedLeads.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedLeads.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive"
                    onClick={handleDeleteSelected}
                    disabled={deleteLeadsBulk.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Dialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Status</DialogTitle>
                        <DialogDescription>
                          Update the status for {selectedLeads.length} selected leads.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as LeadStatus)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="opened">Opened</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="bounced">Bounced</SelectItem>
                            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleBulkStatusUpdate} disabled={!bulkStatus || updateLead.isPending}>
                          {updateLead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Status"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Leads Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLeads.length > 0 ? (
              <>
                <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                        <th className="w-12 px-6 py-3">
                          <Checkbox
                            checked={
                              selectedLeads.length === filteredLeads.length &&
                              filteredLeads.length > 0
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-6 py-3 text-left font-medium">Name</th>
                        <th className="px-6 py-3 text-left font-medium">Email</th>
                        <th className="px-6 py-3 text-left font-medium">Company</th>
                        <th className="px-6 py-3 text-left font-medium">Status</th>
                        <th className="px-6 py-3 text-left font-medium">Campaign</th>
                        <th className="px-6 py-3 text-left font-medium">Step</th>
                        <th className="px-6 py-3 text-left font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedLeads.map((lead) => (
                        <tr key={lead.id} className="group transition-colors hover:bg-muted/30">
                          <td className="px-6 py-4">
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={() => toggleSelectLead(lead.id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-foreground">
                              {lead.first_name || lead.last_name
                                ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim()
                                : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground">{lead.email}</span>
                          </td>
                          <td className="px-6 py-4 text-sm">{lead.company || "-"}</td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                statusConfig[lead.status].color
                              )}
                            >
                              {statusConfig[lead.status].label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground text-sm">
                              {lead.campaign?.name || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground text-sm">
                              {lead.current_step > 0 ? `Step ${lead.current_step}` : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedLeadForDetails(lead);
                                  setIsDetailsPanelOpen(true);
                                }}>View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setEditingLead(lead);
                                  setIsEditLeadDialogOpen(true);
                                }}>Edit Lead</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Unsubscribe
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteLead(lead.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <div className="text-xs text-muted-foreground mr-4">
                      Page {currentPage} of {totalPages} ({filteredLeads.length} items)
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">No leads yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Add your first lead to start building your outreach list.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Lead
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadDialogOpen} onOpenChange={setIsEditLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editingLead.email}
                  onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-first">First Name</Label>
                  <Input
                    id="edit-first"
                    value={editingLead.first_name || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, first_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-last">Last Name</Label>
                  <Input
                    id="edit-last"
                    value={editingLead.last_name || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={editingLead.company || ""}
                  onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editingLead.status} onValueChange={(v) => setEditingLead({ ...editingLead, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateLead} disabled={updateLead.isPending}>
                {updateLead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog open={isEditListDialogOpen} onOpenChange={setIsEditListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead List</DialogTitle>
          </DialogHeader>
          {editingList && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-list-name">List Name</Label>
                <Input
                  id="edit-list-name"
                  value={editingList.name}
                  onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-list-desc">Description</Label>
                <Input
                  id="edit-list-desc"
                  value={editingList.description || ""}
                  onChange={(e) => setEditingList({ ...editingList, description: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateLeadList} disabled={updateLeadList.isPending}>
                {updateLeadList.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lead Details Sheet */}
      <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {selectedLeadForDetails?.first_name?.[0] || selectedLeadForDetails?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-2xl font-black">
                  {selectedLeadForDetails?.first_name} {selectedLeadForDetails?.last_name}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                    selectedLeadForDetails && statusConfig[selectedLeadForDetails.status as LeadStatus]
                      ? statusConfig[selectedLeadForDetails.status as LeadStatus].color
                      : "bg-muted text-muted-foreground"
                  )}>
                    {selectedLeadForDetails?.status}
                  </span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="py-8 space-y-8">
            <section className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Contact Information</h4>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Email</p>
                      <p className="text-sm font-semibold">{selectedLeadForDetails?.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`mailto:${selectedLeadForDetails?.email}`)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {selectedLeadForDetails?.company && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <Building2 className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Company</p>
                      <p className="text-sm font-semibold">{selectedLeadForDetails?.company}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Outreach Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Current Campaign</p>
                  <p className="text-sm font-semibold truncate">{selectedLeadForDetails?.campaign?.name || "None"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Current Step</p>
                  <p className="text-sm font-semibold">{selectedLeadForDetails?.current_step > 0 ? `Step ${selectedLeadForDetails.current_step}` : "N/A"}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Metadata</h4>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Added On</p>
                  <p className="text-sm font-semibold">
                    {selectedLeadForDetails?.created_at ? new Date(selectedLeadForDetails.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="pt-6 border-t mt-auto flex gap-3">
            <Button className="flex-1 gap-2" variant="outline" onClick={() => {
              setEditingLead(selectedLeadForDetails);
              setIsEditLeadDialogOpen(true);
            }}>
              Edit Details
            </Button>
            <Button className="aspect-square p-0" variant="destructive" onClick={() => {
              if (confirm("Delete this lead?")) {
                deleteLead.mutate(selectedLeadForDetails.id);
                setIsDetailsPanelOpen(false);
              }
            }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
