import { useState } from "react";
import { 
  Mail, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MailOpen,
  Reply,
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useInbox, useThreadHistory, Thread } from "@/hooks/useInbox";
import { format } from "date-fns";

export default function Inbox() {
  const { data: threads, isLoading: threadsLoading } = useInbox();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: history, isLoading: historyLoading } = useThreadHistory(selectedThreadId);

  const selectedThread = threads?.find(t => t.leadId === selectedThreadId);

  const filteredThreads = threads?.filter(t => 
    t.lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.lead.first_name && t.lead.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.lead.last_name && t.lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Thread List - Side Pane */}
        <div className="w-96 flex flex-col border-r border-border/50 bg-card/10 backdrop-blur-xl">
          <div className="p-6 border-b border-border/50">
            <h1 className="text-2xl font-black mb-4 tracking-tight">Orbit Inbox</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input 
                placeholder="Search leads..." 
                className="pl-9 bg-background/50 border-white/10 rounded-xl h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {threadsLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse h-24" />
                ))
              ) : filteredThreads.length > 0 ? (
                filteredThreads.map((thread) => (
                  <button
                    key={thread.leadId}
                    onClick={() => setSelectedThreadId(thread.leadId)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl transition-all duration-300 group relative border border-transparent",
                      selectedThreadId === thread.leadId 
                        ? "bg-primary/10 border-primary/20 shadow-premium" 
                        : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm truncate pr-2">
                        {thread.lead.first_name || thread.lead.last_name 
                          ? `${thread.lead.first_name || ''} ${thread.lead.last_name || ''}` 
                          : thread.lead.email}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground/40 whitespace-nowrap">
                        {format(new Date(thread.lastEvent.occurred_at), "h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2 font-medium">
                      {(thread.lastEvent.metadata as any)?.replyBody || thread.lastEvent.subject || "No message content"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {thread.hasReply && (
                          <Badge variant="outline" className="text-[8px] h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-1.5 font-black uppercase tracking-widest">
                            Replied
                          </Badge>
                        )}
                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                          {thread.eventCount} Events
                        </span>
                      </div>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all",
                        thread.hasReply ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-primary/40"
                      )} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Mail className="h-8 w-8 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">Silence in space</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Content - Main Pane */}
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
          {selectedThreadId ? (
            <>
              {/* Detail Header */}
              <div className="px-8 py-5 border-b border-border/50 bg-card/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight leading-none">
                      {selectedThread?.lead.first_name} {selectedThread?.lead.last_name}
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest leading-none">
                      {selectedThread?.lead.email} {selectedThread?.lead.company && `• ${selectedThread?.lead.company}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl border-white/10 hover:bg-white/5">
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl border-white/10 hover:bg-white/5">
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages History */}
              <ScrollArea className="flex-1 p-8">
                <div className="max-w-4xl mx-auto space-y-12 pb-12">
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Decrypting Frequency...</p>
                    </div>
                  ) : history && history.length > 0 ? (
                    history.map((event, index) => {
                      const isReply = event.event_type === 'replied';
                      return (
                        <div key={event.id} className={cn(
                          "flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500",
                          isReply ? "items-start" : "items-end"
                        )} style={{ animationDelay: `${index * 50}ms` }}>
                          
                          <div className={cn(
                            "max-w-[85%] rounded-[2rem] p-8 shadow-2xl relative group",
                            isReply 
                              ? "bg-card border border-white/10 rounded-tl-none" 
                              : "bg-primary text-primary-foreground border-none rounded-tr-none"
                          )}>
                            <div className="flex items-center gap-3 mb-4 opacity-60">
                              {isReply ? <Reply className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {isReply ? "Incoming Reply" : "Broadcasted Message"}
                              </span>
                              <span className="ml-auto text-[10px] font-bold">
                                {format(new Date(event.occurred_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                            
                            <h3 className={cn(
                              "text-lg font-black mb-4 tracking-tight",
                              !isReply && "text-white"
                            )}>
                              {event.subject || "No Subject"}
                            </h3>
                            
                            <div className={cn(
                              "text-sm leading-relaxed whitespace-pre-wrap font-medium",
                              isReply ? "text-muted-foreground/80" : "text-primary-foreground/90"
                            )}>
                              {(event.metadata as any)?.replyBody || "No message body available."}
                            </div>

                            {!isReply && (
                              <div className="mt-6 pt-6 border-t border-white/10 flex gap-4">
                                <div className="flex items-center gap-1.5 grayscale transition-all group-hover:grayscale-0">
                                   <MailOpen className="h-3 w-3 opacity-60" />
                                   <span className="text-[8px] font-black uppercase tracking-widest">Opened</span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-40">
                                   <Clock className="h-3 w-3" />
                                   <span className="text-[8px] font-black uppercase tracking-widest">Campaign: {event.campaign?.name}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-24 text-center">
                       <p className="text-muted-foreground/40 font-black uppercase tracking-[0.2em]">Transmission Null</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Reply Box Placeholder */}
              <div className="p-6 border-t border-border/50 bg-card/10 backdrop-blur-md">
                 <div className="max-w-4xl mx-auto flex gap-3">
                   <div className="flex-1 bg-background/50 border border-white/10 rounded-2xl h-14 flex items-center px-6 text-muted-foreground/40 text-sm font-bold italic tracking-wide">
                     Reply functionality launching in next update...
                   </div>
                   <Button disabled className="h-14 w-14 rounded-2xl shadow-glow">
                      <Send className="h-5 w-5" />
                   </Button>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="h-24 w-24 rounded-[2.5rem] bg-card flex items-center justify-center text-primary/10 mb-8 border border-white/5 shadow-2xl">
                 <MessageSquare className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-2">Select a Thread</h2>
              <p className="text-muted-foreground/60 max-w-sm font-medium leading-relaxed">
                Interact with your leads and monitor the full history of your outreach sequences here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
