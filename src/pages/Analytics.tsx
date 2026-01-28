import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Send, MailOpen, Reply, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const dailyData = [
  { date: "Jan 1", sent: 120, opened: 65, replied: 12 },
  { date: "Jan 2", sent: 145, opened: 78, replied: 15 },
  { date: "Jan 3", sent: 132, opened: 70, replied: 11 },
  { date: "Jan 4", sent: 168, opened: 92, replied: 18 },
  { date: "Jan 5", sent: 155, opened: 85, replied: 14 },
  { date: "Jan 6", sent: 142, opened: 76, replied: 16 },
  { date: "Jan 7", sent: 178, opened: 98, replied: 21 },
];

const campaignPerformance = [
  { name: "Q1 Launch", sent: 847, opened: 423, replied: 67 },
  { name: "Conference", sent: 234, opened: 156, replied: 34 },
  { name: "Partnerships", sent: 89, opened: 45, replied: 8 },
  { name: "Win-back", sent: 156, opened: 89, replied: 12 },
];

const leadStatusData = [
  { name: "Active", value: 2450, color: "hsl(var(--primary))" },
  { name: "Replied", value: 456, color: "hsl(var(--success))" },
  { name: "Bounced", value: 89, color: "hsl(var(--destructive))" },
  { name: "Completed", value: 876, color: "hsl(var(--chart-4))" },
];

export default function Analytics() {
  return (
    <AppLayout>
      <PageHeader
        title="Analytics"
        description="Track your email campaign performance"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => {
              const headers = ["Date", "Sent", "Opened", "Replied"];
              const csvContent = [
                headers.join(","),
                ...dailyData.map(row => `${row.date},${row.sent},${row.opened},${row.replied}`)
              ].join("\n");

              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", "analytics_report.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              Export Report
            </Button>
            <Select defaultValue="7d">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="p-8 space-y-8">
        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Sent"
            value="12,847"
            change={{ value: 12.5, positive: true }}
            icon={Send}
            className="from-blue-500/10 to-indigo-500/5 border-blue-500/20 shadow-premium"
          />
          <MetricCard
            title="Open Rate"
            value="52.3%"
            change={{ value: 3.1, positive: true }}
            icon={MailOpen}
            className="from-emerald-500/10 to-teal-500/5 border-emerald-500/20 shadow-premium"
          />
          <MetricCard
            title="Reply Rate"
            value="8.7%"
            change={{ value: 0.5, positive: false }}
            icon={Reply}
            className="from-violet-500/10 to-purple-500/5 border-violet-500/20 shadow-premium"
          />
          <MetricCard
            title="Bounce Rate"
            value="2.1%"
            change={{ value: 0.3, positive: true }}
            icon={AlertCircle}
            className="from-rose-500/10 to-pink-500/5 border-rose-500/20 shadow-premium"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Activity Over Time */}
          <div className="glass-card p-8 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="font-bold text-2xl text-foreground">
                  Activity Velocity
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                  Volume and engagement over time
                </p>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-card border border-white/40 text-[10px] font-black uppercase tracking-widest text-primary">
                Last 7 Days
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontWeight: 600 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      borderRadius: "16px",
                      boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)",
                      padding: "16px",
                    }}
                    itemStyle={{ fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="opened"
                    stroke="hsl(var(--success))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="replied"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-[11px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Sent</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-muted-foreground">Opened</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-muted-foreground">Replied</span>
              </div>
            </div>
          </div>

          {/* Lead Status Distribution */}
          <div className="glass-card p-10 relative overflow-hidden">
            <div className="mb-10">
              <h3 className="font-bold text-2xl text-foreground">
                Distribution Orbit
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Current standing of all leads</p>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {leadStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      borderRadius: "16px",
                      boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-y-6 gap-x-10 max-w-sm mx-auto">
              {leadStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div
                    className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none mb-1.5">{item.name}</span>
                    <span className="text-lg font-bold text-foreground leading-none">{item.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-8 shadow-premium">
          <div className="mb-8">
            <h3 className="font-bold text-xl text-foreground">
              Campaign Performance
            </h3>
            <p className="text-sm text-muted-foreground">Comparative analysis of active campaigns</p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerformance}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontWeight: 800 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    borderRadius: "16px",
                    boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)",
                  }}
                  cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05 }}
                />
                <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="opened" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="replied" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-[11px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Sent</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <span className="text-muted-foreground">Opened</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
              <span className="text-muted-foreground">Replied</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
