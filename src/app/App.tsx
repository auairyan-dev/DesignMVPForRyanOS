import { useState, useEffect, useRef } from "react";
import {
  Phone, PhoneMissed, PhoneCall,
  Calendar, Clock, MapPin, User, Users,
  Briefcase, FileText, DollarSign, TrendingUp, TrendingDown,
  Bell, Search, Settings, ChevronRight, ChevronLeft,
  CheckCircle, AlertTriangle, XCircle, AlertCircle,
  Mic, Play, Pause,
  MessageSquare, Mail, Send, Plus, X,
  Zap, Bot, Home, Inbox,
  Eye, Check, RefreshCw,
  Upload, BarChart2, Activity,
  MoreHorizontal, Edit2, Star,
  Globe, Trash2, Percent, ChevronDown, ArrowRight, Clipboard,
  Sun, Moon, Wrench,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { ActionItem, Call, Conversation, Customer, Job, NavItem, Quote, QuoteLineItem, Screen } from "@/types/ryanos";
import { ACTION_ITEMS, AI_PRICE_SUGGESTIONS, CALLS, CUSTOMERS, INBOX, JOBS, NAV_ITEMS as NAV_ITEMS_DATA, QUOTES, REVENUE_CHART_DATA } from "@/data/seed";
import { useActionItems, useConversations, useJobs, useQuotes } from "@/lib/use-seed-data";
import { completeActionItem, snoozeActionItem, sendConversationMessage } from "@/lib/api";

const NAV_ITEMS = NAV_ITEMS_DATA.map((item: NavItem) => ({
  ...item,
  icon: ({
    "dashboard": Home,
    "inbox": Inbox,
    "jobs": Briefcase,
    "customers": Users,
    "quotes": FileText,
    "calendar": Calendar,
    "ai-assistant": Bot,
    "settings": Settings,
  } as const)[item.id],
}));

// ─── UTILS ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1).replace(".0", "")}k` : `$${n}`;
const fmtRange = (r: [number, number]) => `${fmt(r[0])}–${fmt(r[1])}`;

function stageColor(stage: string): string {
  if (["Urgent", "Needs owner action", "Overdue"].includes(stage)) return "text-red-400 bg-red-400/10";
  if (["Needs review", "Needs info", "Needs booking"].includes(stage)) return "text-amber-400 bg-amber-400/10";
  if (["Accepted", "Booked", "Job complete", "Paid", "Deposit paid"].includes(stage)) return "text-emerald-400 bg-emerald-400/10";
  if (["Quote replied", "Customer replied"].includes(stage)) return "text-blue-400 bg-blue-400/10";
  if (["Ready to invoice", "Invoice sent", "Deposit due"].includes(stage)) return "text-violet-400 bg-violet-400/10";
  return "text-slate-400 bg-slate-400/10";
}

function paymentLabel(status: string): { text: string; cls: string } {
  const map: Record<string, { text: string; cls: string }> = {
    "ready-to-invoice": { text: "Ready to invoice", cls: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
    "invoice-sent":     { text: "Invoice sent",     cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    "paid":             { text: "Paid ✓",            cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    "overdue":          { text: "Overdue",           cls: "text-red-400 bg-red-400/10 border-red-400/20" },
    "deposit-due":      { text: "Deposit due",       cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    "deposit-paid":     { text: "Deposit paid",      cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  };
  return map[status] ?? { text: status, cls: "text-slate-400 bg-slate-400/10" };
}

function outcomeStyle(outcome: string) {
  if (outcome === "Booked") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  if (["Needs review", "Quote drafted"].includes(outcome)) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  if (outcome === "Missed") return "text-red-400 bg-red-400/10 border-red-400/20";
  return "text-slate-400 bg-slate-400/10 border-slate-400/20";
}

function statusStyle(status: string) {
  if (["Confirmed", "Completed", "Paid", "Accepted"].includes(status)) return "text-emerald-400 bg-emerald-400/10";
  if (["Booked", "Sent", "Invoiced"].includes(status)) return "text-blue-400 bg-blue-400/10";
  if (["Needs review", "Needs approval", "Follow-up due"].includes(status)) return "text-amber-400 bg-amber-400/10";
  if (["Urgent", "Missed", "Overdue", "Cancelled"].includes(status)) return "text-red-400 bg-red-400/10";
  return "text-slate-400 bg-slate-400/10";
}

function confidenceStyle(n: number) {
  if (n >= 90) return { label: `${n}% · High confidence`, cls: "text-emerald-400 bg-emerald-400/10" };
  if (n >= 70) return { label: `${n}% · Review suggested`, cls: "text-amber-400 bg-amber-400/10" };
  if (n === 0) return { label: "No data", cls: "text-slate-400 bg-slate-400/10" };
  return { label: `${n}% · Needs review`, cls: "text-red-400 bg-red-400/10" };
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function Badge({ label, cls = "" }: { label: string; cls?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function Btn({
  children, variant = "primary", onClick, size = "md", full = false, disabled = false, style,
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void; size?: "sm" | "md"; full?: boolean; disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const base = `inline-flex items-center gap-2 font-semibold rounded-xl cursor-pointer transition-all select-none ${full ? "w-full justify-center" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`;
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const v = {
    primary: "bg-blue-500 hover:bg-blue-400 text-white shadow-sm",
    secondary: "bg-card border border-border text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
    danger: "bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20",
  }[variant];
  return (
    <button className={`${base} ${sz} ${v}`} onClick={disabled ? undefined : onClick} style={style}>
      {children}
    </button>
  );
}

function MetricCard({
  title, value, sub, trend, trendUp, onClick, Icon, accentCls = "text-blue-400 bg-blue-400/10",
}: {
  title: string; value: string; sub: string; trend?: string; trendUp?: boolean;
  onClick?: () => void; Icon?: React.ElementType; accentCls?: string;
}) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-border/60 transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">{title}</span>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentCls}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="text-[32px] font-bold text-foreground leading-none">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{sub}</span>
        {trend && (
          <span className={`text-xs flex items-center gap-1 font-medium ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function AlertCard({
  title, desc, actionLabel, onAction, level = "amber",
}: {
  title: string; desc: string; actionLabel?: string; onAction?: () => void; level?: "amber" | "red";
}) {
  const s = level === "red"
    ? { border: "border-red-400/20", icon: "text-red-400 bg-red-400/10" }
    : { border: "border-amber-400/20", icon: "text-amber-400 bg-amber-400/10" };
  return (
    <div className={`bg-card border ${s.border} rounded-xl p-4 flex gap-3`}>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.icon}`}>
        <AlertTriangle size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{desc}</p>
        {actionLabel && (
          <button
            className="text-blue-400 text-xs font-semibold mt-2 hover:text-blue-300 transition-colors"
            onClick={onAction}
          >
            {actionLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

function AICard({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="bg-violet-400/5 border border-violet-400/15 rounded-xl p-4 flex gap-3">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-400/15 text-violet-400">
        <Bot size={13} />
      </span>
      <div className="flex-1">
        <p className="text-foreground text-sm leading-relaxed">{text}</p>
        {actionLabel && (
          <button
            className="text-violet-400 text-xs font-semibold mt-2 hover:text-violet-300 transition-colors"
            onClick={onAction}
          >
            {actionLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-foreground font-semibold text-base">{title}</h2>
        {sub && <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function TimelineItem({ type, desc, time }: { type: string; desc: string; time: string }) {
  const icons: Record<string, React.ElementType> = {
    call: Phone, job: Briefcase, quote: FileText, invoice: DollarSign, sms: MessageSquare,
  };
  const Icon = icons[type] || Activity;
  return (
    <div className="flex gap-3 relative pb-4 last:pb-0">
      <div className="flex flex-col items-center">
        <span className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 z-10 text-muted-foreground">
          <Icon size={12} />
        </span>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="flex-1 pb-1">
        <p className="text-foreground text-sm">{desc}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────

function Sidebar({
  screen, onNavigate,
}: {
  screen: Screen; onNavigate: (s: Screen) => void;
}) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 border-r border-border flex flex-col z-20 bg-sidebar"
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-foreground font-bold text-sm leading-none">RyanOS</div>
            <div className="text-muted-foreground text-[11px] mt-0.5">Alpine Fresh</div>
          </div>
        </div>
        {/* AI status pill */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-400/8 border border-emerald-400/15">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-emerald-400 text-xs font-medium">AI answering calls</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
          const active = screen === id || (screen.startsWith(id + "-") && id !== "settings");
          return (
            <button
              key={id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              {badge && !active && (
                <span className="w-4 h-4 rounded-full bg-red-400/15 text-red-400 text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-400 text-sm font-bold">R</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium truncate">Ryan Thomas</p>
            <p className="text-muted-foreground text-[11px]">Owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  title, sub, onNavigate, theme, onToggleTheme,
}: {
  title: string; sub?: string; onNavigate: (s: Screen) => void;
  theme: "dark" | "light"; onToggleTheme: () => void;
}) {
  return (
    <header
      className="fixed top-0 left-60 right-0 h-14 border-b border-border flex items-center px-6 gap-4 z-10 bg-background"
    >
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-foreground font-semibold text-sm">{title}</h1>
          {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
        </div>
      </div>
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border w-56 cursor-text">
        <Search size={13} className="text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground text-xs">Search or ask AI…</span>
      </div>
      {/* Theme toggle */}
      <button
        className="p-2 rounded-xl hover:bg-muted transition-colors"
        onClick={onToggleTheme}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark"
          ? <Sun size={16} className="text-muted-foreground hover:text-amber-400 transition-colors" />
          : <Moon size={16} className="text-muted-foreground hover:text-blue-400 transition-colors" />
        }
      </button>
      {/* Notifications */}
      <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
        <Bell size={16} className="text-muted-foreground" />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400" />
      </button>
      {/* AI pill */}
      <button
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-400/8 border border-emerald-400/15"
        onClick={() => onNavigate("settings")}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-emerald-400 text-xs font-medium">AI Online</span>
      </button>
    </header>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function DashboardScreen({ onNavigate, onSelect, techSubmissions = [] }: {
  onNavigate: (s: Screen, id?: string) => void;
  onSelect: (id: string) => void;
  techSubmissions?: Array<{ id: string; jobId: string; customerName: string; jobTitle: string; notes: string; materials: Array<{ id: string; desc: string; cost: number }>; photos: number; flagged: boolean; submittedAt: string; extra: string; internalNote: string }>;
}) {
  const todayJobs = JOBS.filter(j => j.date === "Today");
  const [itemStates, setItemStates] = useState<Record<string, "pending" | "called" | "booked" | "snoozed" | "done">>({});
  const [qFilter, setQFilter] = useState("All");
  const [showDone, setShowDone] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { actionItems, refresh: refreshActionItems } = useActionItems();

  const setState = (id: string, state: "called" | "booked" | "snoozed" | "done") =>
    setItemStates(prev => ({ ...prev, [id]: state }));

  const pendingItems = actionItems.filter(item => {
    const s = itemStates[item.id] || "pending";
    if (s !== "pending") return false;
    if (qFilter === "All") return true;
    if (qFilter === "Urgent") return item.priority === "urgent";
    if (qFilter === "Needs review") return item.priority === "needs-review";
    if (qFilter === "Quotes") return item.priority === "accepted" || item.priority === "needs-review";
    if (qFilter === "Missed calls") return item.priority === "missed-call";
    return true;
  });

  const doneItems = actionItems.filter(item => {
    const s = itemStates[item.id] || "pending";
    return s !== "pending";
  });

  const pendingCount = actionItems.filter(i => !itemStates[i.id] || itemStates[i.id] === "pending").length;

  type PriorityKey = "urgent" | "accepted" | "quote-reply" | "needs-review" | "missed-call" | "ready-invoice";
  const PRIORITY: Record<PriorityKey, {
    border: string; bg: string; dot: string; badge: string; primaryVariant: "primary" | "secondary" | "danger";
  }> = {
    urgent:          { border: "border-red-400/30",     bg: "bg-red-400/5",       dot: "bg-red-400",     badge: "text-red-400 bg-red-400/10 border-red-400/20",         primaryVariant: "danger" },
    accepted:        { border: "border-emerald-400/25", bg: "bg-emerald-400/4",   dot: "bg-emerald-400", badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", primaryVariant: "primary" },
    "quote-reply":   { border: "border-blue-500/20",    bg: "bg-blue-500/4",      dot: "bg-blue-400",    badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",       primaryVariant: "primary" },
    "needs-review":  { border: "border-amber-400/25",   bg: "bg-amber-400/4",     dot: "bg-amber-400",   badge: "text-amber-400 bg-amber-400/10 border-amber-400/20",     primaryVariant: "secondary" },
    "missed-call":   { border: "border-border",          bg: "bg-card",            dot: "bg-slate-400",   badge: "text-slate-400 bg-slate-400/10",                         primaryVariant: "secondary" },
    "ready-invoice": { border: "border-violet-400/20",  bg: "bg-violet-400/5",    dot: "bg-violet-400",  badge: "text-violet-400 bg-violet-400/10 border-violet-400/20",  primaryVariant: "primary" },
  };

  const stateLabel: Record<string, { text: string; cls: string }> = {
    called:  { text: "Called ✓",   cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    booked:  { text: "Booked ✓",   cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    snoozed: { text: "Snoozed",    cls: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
    done:    { text: "Done ✓",     cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  };

  return (
    <div className="p-7 space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Good morning, Ryan.</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            AI answered 23 calls and booked 6 jobs while you were away.
          </p>
        </div>
      </div>

      {/* Main two-column layout: Action Queue + Right Rail */}
      <div className="grid grid-cols-5 gap-6 items-start">

        {/* ── LEFT: Action Queue (3/5) ─────────────────────────── */}
        <div className="col-span-3 space-y-4">

          {/* Queue header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground font-bold text-base">
                Today's action queue
                {pendingCount > 0 && (
                  <span className="ml-2 text-sm font-semibold text-amber-400">
                    {pendingCount} item{pendingCount !== 1 ? "s" : ""} need attention
                  </span>
                )}
                {pendingCount === 0 && (
                  <span className="ml-2 text-sm font-semibold text-emerald-400">All clear ✓</span>
                )}
              </h2>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {["All", "Urgent", "Needs review", "Quotes", "Missed calls"].map(f => (
              <button
                key={f}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  qFilter === f
                    ? f === "Urgent" ? "bg-red-400/15 text-red-400 border-red-400/20" : "bg-blue-500/10 text-blue-400 border-blue-500/15"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setQFilter(f)}
              >
                {f}
                {f === "Urgent" && pendingItems.some(i => i.priority === "urgent") && (
                  <span className="ml-1 text-red-400">●</span>
                )}
              </button>
            ))}
          </div>

          {/* Queue cards */}
          {/* Tech job submissions — appear at top when techs complete jobs */}
          {techSubmissions.length > 0 && (
            <div className="space-y-2 mb-3">
              {techSubmissions.map(sub => {
                const matTotal = sub.materials.reduce((s, m) => s + m.cost, 0);
                return (
                  <div key={sub.id} className="border border-violet-400/25 bg-violet-400/4 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-violet-400 bg-violet-400/10 border border-violet-400/20">Tech submitted</span>
                      <span className="text-foreground font-semibold text-sm">{sub.customerName}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{sub.submittedAt}</span>
                    </div>
                    <p className="text-foreground text-sm mb-1 font-medium">{sub.jobTitle}</p>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {sub.notes && <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Edit2 size={10} /> Notes added</span>}
                      {sub.materials.length > 0 && <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Wrench size={10} /> {sub.materials.length} materials {matTotal > 0 ? `· $${matTotal}` : ""}</span>}
                      {sub.photos > 0 && <span className="text-xs text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Upload size={10} /> {sub.photos} photos</span>}
                      {sub.flagged && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Flagged for review</span>}
                    </div>
                    <Btn variant="primary" full onClick={() => onNavigate("quotes")}>
                      <Eye size={14} /> Review job notes + create invoice
                    </Btn>
                    <div className="flex gap-2 mt-2">
                      <Btn variant="ghost" size="sm">Schedule follow-up</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => onNavigate("jobs")}>Open job</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pendingItems.length === 0 && !showDone && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-foreground font-semibold text-sm">Nothing needs attention right now.</p>
              <p className="text-muted-foreground text-xs mt-1">
                {doneItems.length > 0 ? `You cleared ${doneItems.length} item${doneItems.length !== 1 ? "s" : ""} today. Good work.` : "Check back after the next call comes in."}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {pendingItems.map(item => {
              const pc = PRIORITY[item.priority as PriorityKey] || PRIORITY["missed-call"];
              const desktopLinkedCustomer = CUSTOMERS.find(c => c.name === item.customer);
              const desktopLinkedJob = desktopLinkedCustomer ? jobs.find(j => j.customerId === desktopLinkedCustomer.id) ?? JOBS.find(j => j.customerId === desktopLinkedCustomer.id) : null;
              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-5 ${pc.border} ${pc.bg} transition-all`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${pc.badge}`}>
                        {item.label}
                      </span>
                      <span className="text-foreground font-semibold text-sm">{item.customer}</span>
                      {item.phone && (
                        <span className="text-muted-foreground text-xs">{item.phone}</span>
                      )}
                    </div>
                    {item.linkedLabel && (
                      <button
                        className="text-[11px] text-blue-400 font-medium hover:text-blue-300 transition-colors flex-shrink-0 flex items-center gap-1"
                        onClick={() => {
                          if (item.linkedScreen) {
                            if (item.linkedId) onSelect(item.linkedId);
                            onNavigate(item.linkedScreen);
                          }
                        }}
                      >
                        <FileText size={10} /> {item.linkedLabel}
                      </button>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-foreground text-sm leading-relaxed mb-1.5">{item.summary}</p>

                  {/* Why it matters */}
                  <p className="text-muted-foreground text-xs leading-relaxed mb-3 italic">{item.why}</p>

                  {/* AI confidence note */}
                  {item.confidence && (
                    <div className="flex items-start gap-2 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-2 mb-3">
                      <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-400 text-xs leading-relaxed">{item.confidence}</p>
                    </div>
                  )}

                  {/* Primary action — full width */}
                  <Btn
                    variant={pc.primaryVariant}
                    full
                    onClick={() => {
                      if (item.primaryAction === "Book job" && item.linkedId) {
                        onSelect(item.linkedId); onNavigate(item.linkedScreen || "quotes");
                      } else if (item.primaryAction === "Review & approve" && item.linkedId) {
                        onSelect(item.linkedId); onNavigate(item.linkedScreen || "quotes");
                      } else if (item.primaryAction === "Review" || item.primaryAction === "Decide" || item.primaryAction === "Create invoice draft") {
                        if (item.linkedId) { onSelect(item.linkedId); }
                        onNavigate(item.linkedScreen || "inbox");
                      } else {
                        setState(item.id, item.priority === "urgent" || item.priority === "missed-call" ? "called" : "done");
                      }
                    }}
                  >
                    {item.priority === "urgent" ? <Phone size={14} /> :
                     item.priority === "accepted" ? <Briefcase size={14} /> :
                     item.priority === "needs-review" ? <Eye size={14} /> :
                     item.priority === "ready-invoice" ? <FileText size={14} /> :
                     <Phone size={14} />}
                    {item.primaryAction}
                  </Btn>

                  {/* Job strip — open existing or create new */}
                  <button
                    className="w-full mt-3 flex items-center gap-3 px-4 py-3 bg-secondary border border-border rounded-xl hover:border-border/60 transition-colors text-left"
                    onClick={() => {
                      if (desktopLinkedJob) { onSelect(desktopLinkedJob.id); onNavigate("job-detail"); }
                      else onNavigate("jobs");
                    }}
                  >
                    <Briefcase size={15} className={desktopLinkedJob ? "text-blue-400 flex-shrink-0" : "text-emerald-400 flex-shrink-0"} />
                    <div className="flex-1 min-w-0">
                      {desktopLinkedJob ? (
                        <>
                          <p className="text-foreground text-sm font-semibold truncate">{desktopLinkedJob.title}</p>
                          <p className="text-muted-foreground text-xs">{desktopLinkedJob.date} · {desktopLinkedJob.time} · {desktopLinkedJob.suburb}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-foreground text-sm font-semibold">{item.customer} — no job created yet</p>
                          <p className="text-muted-foreground text-xs">Create a job ticket to schedule and manage this work</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {desktopLinkedJob && <Badge label={desktopLinkedJob.status} cls={statusStyle(desktopLinkedJob.status)} />}
                      <span className={`text-xs font-semibold ${desktopLinkedJob ? "text-blue-400" : "text-emerald-400"}`}>
                        {desktopLinkedJob ? "Open job →" : "+ Create job"}
                      </span>
                    </div>
                  </button>

                  {/* Secondary row + Other button */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {item.secondaryActions.slice(0, 2).map((action, i) => (
                      <Btn key={i} variant="ghost" size="sm"
                        onClick={() => {
                          const a = action.toLowerCase();
                          if (a.includes("snooze")) {
                            setState(item.id, "snoozed");
                            void snoozeActionItem(item.id, 60).then(refreshActionItems);
                          }
                          else if (a.includes("inbox")) onNavigate("inbox");
                          else if (a.includes("quote")) { if (item.linkedId) onSelect(item.linkedId); onNavigate("quote-detail"); }
                          else if (a.includes("job")) onNavigate("jobs");
                          else if (a.includes("decline") || a.includes("not suitable") || a === "done") {
                            setState(item.id, "done");
                            void completeActionItem(item.id).then(refreshActionItems);
                          }
                        }}
                      >{action}</Btn>
                    ))}
                    <Btn variant="ghost" size="sm"
                      onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                    >
                      {expandedCard === item.id ? "Less ↑" : "Other ↓"}
                    </Btn>
                  </div>

                  {/* Expanded — all available actions */}
                  {expandedCard === item.id && (() => {
                    // Standardised action list — same order every time
                    const STANDARD_ACTIONS: Array<{
                      icon: React.ElementType; label: string;
                      variant?: "danger" | "muted";
                      action: () => void;
                    }> = [
                      { icon: Check,       label: "Mark as done",      variant: "muted", action: () => { setState(item.id, "done"); setExpandedCard(null); void completeActionItem(item.id).then(refreshActionItems); } },
                      { icon: RefreshCw,   label: "Snooze for later",  variant: "muted", action: () => { setState(item.id, "snoozed"); setExpandedCard(null); void snoozeActionItem(item.id, 60).then(refreshActionItems); } },
                      { icon: Phone,       label: "Call customer",           action: () => { setState(item.id, "called"); setExpandedCard(null); } },
                      { icon: MessageSquare, label: "Send SMS",              action: () => { setState(item.id, "called"); setExpandedCard(null); } },
                      { icon: Inbox,       label: "Open in Inbox",           action: () => { if (item.linkedId) { onSelect(item.linkedId); } onNavigate("inbox"); } },
                      { icon: FileText,    label: "View quote",              action: () => { if (item.linkedId) onSelect(item.linkedId); onNavigate("quote-detail"); } },
                      { icon: Briefcase,   label: "View job",                action: () => { onNavigate("jobs"); } },
                      { icon: User,        label: "View customer",           action: () => { if (item.linkedId?.startsWith("c")) { onSelect(item.linkedId); onNavigate("customer-detail"); } else onNavigate("customers"); } },
                      { icon: Calendar,    label: "Open calendar",           action: () => { onNavigate("calendar"); } },
                      { icon: DollarSign,  label: "Create invoice draft",    action: () => { onNavigate("quotes"); } },
                      { icon: Edit2,       label: "Add a note",              action: () => { if (item.linkedId) onSelect(item.linkedId); onNavigate("customer-detail"); } },
                    ];
                    return (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide mb-2">All options</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {STANDARD_ACTIONS.map(({ icon: Icon, label, variant, action }) => (
                            <button
                              key={label}
                              className={`text-left text-xs px-3 py-2.5 rounded-xl border transition-colors flex items-center gap-2 ${
                                variant === "danger"
                                  ? "bg-red-400/8 border-red-400/15 text-red-400 hover:bg-red-400/15"
                                  : variant === "muted"
                                  ? "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                  : "bg-secondary border-border text-foreground hover:bg-muted"
                              }`}
                              onClick={action}
                            >
                              <Icon size={13} className="flex-shrink-0 opacity-70" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* Completed items */}
            {showDone && doneItems.map(item => {
              const s = itemStates[item.id] || "done";
              const sl = stateLabel[s] || stateLabel.done;
              return (
                <div key={item.id} className="border border-border/40 rounded-2xl p-4 opacity-60 flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sl.cls}`}>{sl.text}</span>
                  <p className="text-muted-foreground text-sm flex-1">{item.customer} · {item.label}</p>
                  <button
                    className="text-muted-foreground text-xs hover:text-foreground transition-colors"
                    onClick={() => setItemStates(prev => { const n = { ...prev }; delete n[item.id]; return n; })}
                  >
                    Undo
                  </button>
                </div>
              );
            })}
          </div>

          {/* Show completed toggle */}
          {doneItems.length > 0 && (
            <button
              className="text-muted-foreground text-xs hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => setShowDone(v => !v)}
            >
              <RefreshCw size={11} />
              {showDone ? "Hide" : `Show ${doneItems.length} completed today`}
            </button>
          )}
        </div>

        {/* ── RIGHT RAIL (2/5) ─────────────────────────────────── */}
        <div className="col-span-2 space-y-5">

          {/* Compact 2×2 metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Calls today", value: "23", sub: "18 by AI · 2 missed", Icon: Phone, cls: "text-blue-400 bg-blue-400/10", screen: "inbox" as Screen },
              { label: "Jobs booked", value: "3", sub: "6 total this week", Icon: Briefcase, cls: "text-emerald-400 bg-emerald-400/10", screen: "jobs" as Screen },
              { label: "Quotes waiting", value: "2", sub: "Need your approval", Icon: FileText, cls: "text-amber-400 bg-amber-400/10", screen: "quotes" as Screen },
              { label: "Revenue week", value: "$8.6k", sub: "+34% on last week", Icon: DollarSign, cls: "text-emerald-400 bg-emerald-400/10", screen: "jobs" as Screen },
            ].map(({ label, value, sub, Icon, cls, screen }) => (
              <div
                key={label}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-border/60 transition-colors"
                onClick={() => onNavigate(screen)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-[11px]">{label}</span>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${cls}`}>
                    <Icon size={12} />
                  </span>
                </div>
                <p className="text-foreground font-bold text-xl leading-none">{value}</p>
                <p className="text-muted-foreground text-[11px] mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Today's jobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-foreground font-semibold text-sm">Today's jobs</h3>
              <button
                className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors"
                onClick={() => onNavigate("calendar")}
              >
                Calendar →
              </button>
            </div>
            <div className="space-y-2">
              {todayJobs.map(job => (
                <div key={job.id} className="bg-card border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-foreground font-bold text-sm w-14 flex-shrink-0">{job.time}</span>
                      <div>
                        <p className="text-foreground text-xs font-medium leading-none">{job.customer}</p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{job.suburb} · {job.type}</p>
                      </div>
                    </div>
                    <Badge label={job.status} cls={`${statusStyle(job.status)} text-[10px]`} />
                  </div>
                  <div className="flex gap-1.5">
                    <Btn size="sm" variant="ghost"><Phone size={11} /> Call</Btn>
                    <Btn size="sm" variant="ghost"><MapPin size={11} /> Navigate</Btn>
                    {job.status === "Confirmed" && (
                      <Btn size="sm" variant="ghost"><CheckCircle size={11} /> On my way</Btn>
                    )}
                    <Btn
                      size="sm" variant="ghost"
                      onClick={() => { onSelect(job.id); onNavigate("job-detail"); }}
                    >
                      <Eye size={11} /> View
                    </Btn>
                  </div>
                </div>
              ))}
              {todayJobs.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No jobs scheduled today.</p>
              )}
            </div>
          </div>

          {/* AI status note */}
          <div className="bg-violet-400/5 border border-violet-400/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-violet-400 text-xs font-semibold">AI is active</span>
            </div>
            <p className="text-foreground text-xs leading-relaxed">
              AI answered 18 of today's 23 calls. 3 were auto-booked with high confidence. 2 were escalated to you.
            </p>
            <button
              className="text-violet-400 text-[11px] font-semibold mt-2 hover:text-violet-300 transition-colors"
              onClick={() => onNavigate("inbox")}
            >
              View all calls in Inbox →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CALLS LIST ───────────────────────────────────────────────────────────────

function CallsScreen({ onNavigate, onSelect }: { onNavigate: (s: Screen, id?: string) => void; onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Booked", "Needs review", "Missed", "Emergency"];

  const filtered = CALLS.filter(c => {
    if (filter === "All") return true;
    if (filter === "Booked") return c.outcome === "Booked";
    if (filter === "Needs review") return c.needsReview;
    if (filter === "Missed") return c.outcome === "Missed";
    return true;
  });

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground text-xl font-bold">Calls</h1>
          <p className="text-muted-foreground text-sm mt-0.5">AI receptionist log · {CALLS.length} calls today</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-400/8 border border-emerald-400/15">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-sm font-medium">AI answering calls</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-border pb-4">
        {filters.map(f => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "Needs review" && <span className="ml-1.5 text-[10px] bg-amber-400/15 text-amber-400 rounded-full px-1.5 py-0.5">2</span>}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-4 pb-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        <span className="col-span-2">Time</span>
        <span className="col-span-2">Caller</span>
        <span className="col-span-3">Reason</span>
        <span className="col-span-2">Outcome</span>
        <span className="col-span-1">Confidence</span>
        <span className="col-span-2">Action</span>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {filtered.map(call => {
          const conf = confidenceStyle(call.confidence);
          return (
            <div
              key={call.id}
              className="grid grid-cols-12 gap-3 items-center px-4 py-3.5 bg-card border border-border rounded-xl hover:border-border/60 cursor-pointer transition-colors"
              onClick={() => { onSelect(call.id); onNavigate("call-detail"); }}
            >
              <div className="col-span-2">
                <p className="text-foreground text-sm font-medium">{call.time}</p>
                <p className="text-muted-foreground text-xs">{call.duration}</p>
              </div>
              <div className="col-span-2">
                <p className="text-foreground text-sm font-medium">{call.caller === "Unknown caller" ? <span className="text-muted-foreground">Unknown</span> : call.caller}</p>
                <p className="text-muted-foreground text-xs">{call.phone}</p>
              </div>
              <div className="col-span-3">
                <p className="text-foreground text-sm truncate">{call.jobType === "Unknown" ? <span className="text-muted-foreground italic">No details captured</span> : call.jobType}</p>
                {call.urgency !== "Unknown" && <p className="text-muted-foreground text-xs">{call.urgency}</p>}
              </div>
              <div className="col-span-2">
                <Badge label={call.outcome} cls={`${outcomeStyle(call.outcome)} border`} />
                {call.needsReview && <p className="text-amber-400 text-[10px] mt-1 font-medium">⚠ Owner review</p>}
              </div>
              <div className="col-span-1">
                {call.confidence > 0 ? (
                  <span className={`text-xs font-semibold ${conf.cls} px-1.5 py-0.5 rounded-md`}>{call.confidence}%</span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
              <div className="col-span-2 flex gap-2">
                <Btn size="sm" variant="secondary" onClick={e => { e.stopPropagation(); onSelect(call.id); onNavigate("call-detail"); }}>
                  <Eye size={12} /> Review
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CALL DETAIL ─────────────────────────────────────────────────────────────

function CallDetailScreen({
  callId, onBack, onNavigate, onSelect,
}: {
  callId: string; onBack: () => void; onNavigate: (s: Screen, id?: string) => void; onSelect: (id: string) => void;
}) {
  const call = CALLS.find(c => c.id === callId) ?? CALLS[0];
  const conf = confidenceStyle(call.confidence);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="p-7 space-y-6">
      {/* Back + header */}
      <div>
        <button className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground mb-4 transition-colors" onClick={onBack}>
          <ChevronLeft size={16} /> Back to calls
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-foreground text-xl font-bold">{call.caller}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {call.time} · {call.duration} · {call.phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={call.outcome} cls={`${outcomeStyle(call.outcome)} border`} />
            {call.confidence > 0 && (
              <Badge label={conf.label} cls={`${conf.cls} border`} />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left — transcript + player */}
        <div className="col-span-3 space-y-5">
          {/* AI summary */}
          <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={15} className="text-violet-400" />
              <span className="text-violet-400 text-sm font-semibold">AI summary</span>
            </div>
            <p className="text-foreground text-sm leading-relaxed">{call.summary}</p>
          </div>

          {/* Audio player */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mic size={14} className="text-muted-foreground" />
              <span className="text-foreground text-sm font-semibold">Call recording</span>
              <span className="text-muted-foreground text-xs ml-auto">{call.duration}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors flex-shrink-0"
                onClick={() => setPlaying(!playing)}
              >
                {playing ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white ml-0.5" />}
              </button>
              <div className="flex-1 h-1.5 bg-muted rounded-full relative">
                <div className="absolute left-0 top-0 h-full w-1/3 bg-blue-500 rounded-full" />
                <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-3 h-3 rounded-full bg-white shadow-sm -ml-1.5" />
              </div>
              <span className="text-muted-foreground text-xs">1:14 / {call.duration.replace("m ", ":").replace("s", "")}</span>
            </div>
            <p className="text-muted-foreground text-xs mt-3">Recording stored securely. Customer was informed at call start.</p>
          </div>

          {/* Transcript */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground text-sm font-semibold mb-4">Transcript</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {call.transcript.map((line, i) => (
                <div key={i} className={`flex gap-3 ${line.speaker === "Customer" ? "justify-start" : "justify-end"}`}>
                  {line.speaker === "Customer" && (
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={11} className="text-muted-foreground" />
                    </span>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    line.speaker === "AI"
                      ? "bg-violet-400/10 border border-violet-400/15 text-foreground rounded-tr-sm"
                      : "bg-secondary border border-border text-foreground rounded-tl-sm"
                  }`}>
                    <p className="text-[11px] font-medium mb-1" style={{ color: line.speaker === "AI" ? "#A78BFA" : "#7F8998" }}>
                      {line.speaker === "AI" ? "AI Receptionist" : "Customer"} · {line.time}
                    </p>
                    {line.text}
                  </div>
                  {line.speaker === "AI" && (
                    <span className="w-6 h-6 rounded-full bg-violet-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={11} className="text-violet-400" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — extracted + actions */}
        <div className="col-span-2 space-y-5">
          {/* Extracted details */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground text-sm font-semibold mb-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-400" />
              Extracted details
            </h3>
            <div className="space-y-3">
              {[
                { label: "Name", value: call.extracted.name },
                { label: "Phone", value: call.extracted.phone },
                { label: "Address", value: call.extracted.address },
                { label: "Job type", value: call.extracted.jobType },
                { label: "Urgency", value: call.extracted.urgency },
                { label: "Estimate range", value: call.extracted.range[0] > 0 ? fmtRange(call.extracted.range) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-muted-foreground text-xs w-24 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-foreground text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence */}
          {call.needsReview && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold">Owner review needed</span>
              </div>
              <p className="text-foreground text-sm leading-relaxed">
                {call.extracted.address.includes("Beechworth")
                  ? "Address is outside normal service area (95 km). Diagnosis also uncertain. Confirm with customer before committing."
                  : "AI confidence is below threshold. Review transcript and confirm details before taking action."}
              </p>
            </div>
          )}

          {/* Linked job */}
          {call.jobCreated && call.jobId && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-foreground text-sm font-semibold mb-3">Linked job</h3>
              {(() => {
                const job = JOBS.find(j => j.id === call.jobId);
                if (!job) return null;
                return (
                  <div
                    className="cursor-pointer"
                    onClick={() => { onSelect(job.id); onNavigate("job-detail"); }}
                  >
                    <p className="text-foreground text-sm font-medium">{job.title}</p>
                    <p className="text-muted-foreground text-xs mt-1">{job.date} · {job.time} · {job.suburb}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge label={job.status} cls={statusStyle(job.status)} />
                      <span className="text-muted-foreground text-xs">{fmtRange(job.value)}</span>
                    </div>
                    <button className="text-blue-400 text-xs font-semibold mt-2 hover:text-blue-300 transition-colors">Open job →</button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-foreground text-sm font-semibold">Owner actions</h3>
            {call.jobCreated ? (
              <Btn variant="primary" full onClick={() => call.jobId && (onSelect(call.jobId), onNavigate("job-detail"))}>
                <CheckCircle size={14} /> Approve booking
              </Btn>
            ) : null}
            <Btn variant="secondary" full>
              <Phone size={14} /> Call customer
            </Btn>
            <Btn variant="secondary" full>
              <MessageSquare size={14} /> Send SMS
            </Btn>
            {!call.jobCreated && (
              <Btn variant="secondary" full>
                <Briefcase size={14} /> Create job
              </Btn>
            )}
            <Btn variant="ghost" full>
              <Check size={14} /> Mark resolved
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── JOBS LIST ────────────────────────────────────────────────────────────────

function JobsScreen({ onNavigate, onSelect }: { onNavigate: (s: Screen, id?: string) => void; onSelect: (id: string) => void }) {
  const { jobs } = useJobs();
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Today", "Needs review", "Booked", "Unscheduled"];
  const [showCreate, setShowCreate] = useState(false);
  const [newJobForm, setNewJobForm] = useState({ customer: "", jobType: "", suburb: "", date: "Today", time: "9:00 AM", urgency: "Normal", notes: "" });
  const [desktopCreatedJobs, setDesktopCreatedJobs] = useState<Job[]>([]);

  const filtered = jobs.filter(j => {
    if (filter === "All") return true;
    if (filter === "Today") return j.date === "Today";
    if (filter === "Needs review") return j.status === "Needs review";
    if (filter === "Booked") return ["Booked", "Confirmed"].includes(j.status);
    if (filter === "Unscheduled") return j.date === "Unscheduled";
    return true;
  });

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground text-xl font-bold">Jobs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{jobs.length} total · 3 today · est. $3,840–$5,246</p>
        </div>
        <Btn variant="primary" onClick={() => setShowCreate(v => !v)}>
          <Plus size={14} /> {showCreate ? "Cancel" : "New job"}
        </Btn>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="bg-card border border-blue-500/20 rounded-2xl p-5 mb-5">
          <h3 className="text-foreground font-semibold text-sm mb-4">Create a new job</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-muted-foreground text-xs font-medium block mb-1.5">Customer</label>
              <div className="relative">
                <select className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                  value={newJobForm.customer}
                  onChange={e => setNewJobForm(p => ({ ...p, customer: e.target.value }))}>
                  <option value="">Select…</option>
                  {CUSTOMERS.map(c => <option key={c.id} value={c.name}>{c.name} — {c.suburb}</option>)}
                  <option value="new">+ New customer</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium block mb-1.5">Job type</label>
              <div className="relative">
                <select className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                  value={newJobForm.jobType}
                  onChange={e => setNewJobForm(p => ({ ...p, jobType: e.target.value }))}>
                  <option value="">Select…</option>
                  {["Chimney sweep","Water tank clean","Gutter clean","Roof moss treatment","Plumbing","HVAC repair","Emergency callout","Other"].map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium block mb-1.5">Suburb / address</label>
              <input className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                placeholder="e.g. Albury NSW"
                value={newJobForm.suburb}
                onChange={e => setNewJobForm(p => ({ ...p, suburb: e.target.value }))} />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium block mb-1.5">Date</label>
              <div className="relative">
                <select className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                  value={newJobForm.date}
                  onChange={e => setNewJobForm(p => ({ ...p, date: e.target.value }))}>
                  {["Today","Tomorrow","Friday","Monday","Tuesday","Wednesday","Thursday"].map(d => <option key={d}>{d}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium block mb-1.5">Time</label>
              <div className="relative">
                <select className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                  value={newJobForm.time}
                  onChange={e => setNewJobForm(p => ({ ...p, time: e.target.value }))}>
                  {["7:00 AM","8:00 AM","8:30 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"].map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium block mb-1.5">Urgency</label>
              <div className="flex gap-2 h-9 items-center">
                {["Normal","Urgent"].map(u => (
                  <button key={u}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${newJobForm.urgency === u ? u === "Urgent" ? "bg-red-400/15 border-red-400/25 text-red-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-muted border-border text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setNewJobForm(p => ({ ...p, urgency: u }))}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-muted-foreground text-xs font-medium block mb-1.5">Notes <span className="font-normal">(optional)</span></label>
            <textarea className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-sm resize-none focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
              rows={2} placeholder="What does this job involve?"
              value={newJobForm.notes}
              onChange={e => setNewJobForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <Btn variant="primary"
              disabled={!newJobForm.customer || !newJobForm.jobType}
              onClick={() => {
                if (!newJobForm.customer || !newJobForm.jobType) return;
                const job = {
                  id: `new-${Date.now()}`, title: `${newJobForm.jobType} — ${newJobForm.customer.split(" ")[0]}`,
                  customer: newJobForm.customer, customerId: CUSTOMERS.find(c => c.name === newJobForm.customer)?.id || "",
                  suburb: newJobForm.suburb || "TBC", address: newJobForm.suburb || "Address TBC",
                  time: newJobForm.time, date: newJobForm.date, status: "New", type: newJobForm.jobType,
                  value: [0, 0] as [number, number], tech: "Ryan Thomas",
                  urgency: newJobForm.urgency, source: "Manual", confidence: 100, aiNote: newJobForm.notes,
                };
                setDesktopCreatedJobs(prev => [job, ...prev]);
                setNewJobForm({ customer: "", jobType: "", suburb: "", date: "Today", time: "9:00 AM", urgency: "Normal", notes: "" });
                setShowCreate(false);
              }}>
              <Briefcase size={14} /> Create job
            </Btn>
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Newly created jobs */}
      {desktopCreatedJobs.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {desktopCreatedJobs.map(job => (
            <div key={job.id} className="px-5 py-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge label="New" cls="text-blue-400 bg-blue-400/10" />
                  {job.urgency === "Urgent" && <Badge label="Urgent" cls="text-red-400 bg-red-400/10" />}
                </div>
                <p className="text-foreground font-semibold text-sm">{job.title}</p>
                <p className="text-muted-foreground text-xs">{job.customer} · {job.suburb} · {job.date} {job.time}</p>
                {job.aiNote && <p className="text-muted-foreground text-xs mt-0.5 italic line-clamp-1">{job.aiNote}</p>}
              </div>
              <Btn size="sm" variant="primary"><CheckCircle size={12} /> Confirm booking</Btn>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-border pb-4">
        {filters.map(f => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-4 pb-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        <span className="col-span-1">Time</span>
        <span className="col-span-3">Job</span>
        <span className="col-span-2">Customer</span>
        <span className="col-span-1">Suburb</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-1">Value</span>
        <span className="col-span-2">Action</span>
      </div>

      <div className="space-y-1.5">
        {filtered.map(job => (
          <div
            key={job.id}
            className="grid grid-cols-12 gap-3 items-center px-4 py-3.5 bg-card border border-border rounded-xl hover:border-border/60 cursor-pointer transition-colors"
            onClick={() => { onSelect(job.id); onNavigate("job-detail"); }}
          >
            <div className="col-span-1">
              <p className="text-foreground text-sm font-medium">{job.time}</p>
              <p className="text-muted-foreground text-[11px]">{job.date}</p>
            </div>
            <div className="col-span-3">
              <p className="text-foreground text-sm font-medium truncate">{job.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-muted-foreground text-xs">{job.type}</span>
                {job.urgency === "Urgent" && <Badge label="Urgent" cls="text-red-400 bg-red-400/10" />}
                {job.source === "AI Call" && <span className="text-violet-400 text-[10px] font-medium">· AI booked</span>}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-foreground text-sm">{job.customer}</p>
            </div>
            <div className="col-span-1">
              <p className="text-foreground text-sm">{job.suburb}</p>
            </div>
            <div className="col-span-2">
              <Badge label={job.status} cls={statusStyle(job.status)} />
              {job.tech !== "Unassigned" && <p className="text-muted-foreground text-[11px] mt-1">{job.tech}</p>}
            </div>
            <div className="col-span-1">
              <p className="text-foreground text-sm font-medium">{fmtRange(job.value)}</p>
            </div>
            <div className="col-span-2" onClick={e => e.stopPropagation()}>
              <Btn size="sm" variant="secondary" onClick={() => { onSelect(job.id); onNavigate("job-detail"); }}>
                <Eye size={12} /> View
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── JOB DETAIL ───────────────────────────────────────────────────────────────

function JobDetailScreen({
  jobId, onBack, onNavigate, onSelect,
}: {
  jobId: string; onBack: () => void; onNavigate: (s: Screen, id?: string) => void; onSelect: (id: string) => void;
}) {
  const { jobs } = useJobs();
  const job = jobs.find(j => j.id === jobId) ?? jobs[0] ?? JOBS[0];
  const customer = CUSTOMERS.find(c => c.id === job.customerId);

  return (
    <div className="p-7 space-y-6">
      <div>
        <button className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground mb-4 transition-colors" onClick={onBack}>
          <ChevronLeft size={16} /> Back to jobs
        </button>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge label={job.status} cls={`${statusStyle(job.status)} text-sm px-3 py-1`} />
              {job.urgency === "Urgent" && <Badge label="Urgent" cls="text-red-400 bg-red-400/10 border-red-400/20 text-sm px-3 py-1" />}
              {job.source === "AI Call" && (
                <span className="flex items-center gap-1 text-violet-400 text-xs font-medium">
                  <Bot size={12} /> AI booked
                </span>
              )}
            </div>
            <h1 className="text-foreground text-2xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{job.date} · {job.time} · {job.suburb}</p>
          </div>
          <div className="flex gap-2">
            {job.status === "Needs review" ? (
              <Btn variant="primary"><CheckCircle size={14} /> Approve job</Btn>
            ) : job.status === "Booked" ? (
              <Btn variant="primary"><CheckCircle size={14} /> Confirm booking</Btn>
            ) : (
              <Btn variant="primary"><Check size={14} /> Mark complete</Btn>
            )}
            <Btn variant="secondary"><MoreHorizontal size={14} /></Btn>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Customer card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-3">Customer</h3>
          {customer && (
            <>
              <p className="text-foreground font-semibold">{customer.name}</p>
              <p className="text-muted-foreground text-sm mt-1">{customer.phone}</p>
              <p className="text-muted-foreground text-sm">{customer.email}</p>
              <div className="flex gap-2 mt-3">
                <Btn size="sm" variant="secondary"><Phone size={12} /> Call</Btn>
                <Btn size="sm" variant="secondary"><MessageSquare size={12} /> SMS</Btn>
              </div>
              <button
                className="text-blue-400 text-xs font-semibold mt-3 hover:text-blue-300 transition-colors block"
                onClick={() => { onSelect(customer.id); onNavigate("customer-detail"); }}
              >
                View full profile →
              </button>
            </>
          )}
        </div>

        {/* Schedule card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-3">Schedule</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-foreground text-sm">{job.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-foreground text-sm">{job.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-muted-foreground" />
              <span className={`text-sm ${job.tech === "Unassigned" ? "text-amber-400" : "text-foreground"}`}>{job.tech}</span>
            </div>
          </div>
          <Btn size="sm" variant="secondary" full onClick={() => onNavigate("calendar")} style={{ marginTop: 12 }}>
            <Calendar size={12} /> View on calendar
          </Btn>
        </div>

        {/* Address card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-3">Address</h3>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-foreground text-sm leading-relaxed">{job.address}</p>
          </div>
          <Btn size="sm" variant="secondary" full style={{ marginTop: 12 }}>
            <MapPin size={12} /> Open in Maps
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* AI summary */}
        <div className="col-span-2 bg-violet-400/5 border border-violet-400/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={14} className="text-violet-400" />
            <span className="text-violet-400 text-sm font-semibold">AI notes</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${confidenceStyle(job.confidence).cls}`}>
              {job.confidence}% confidence
            </span>
          </div>
          <p className="text-foreground text-sm leading-relaxed">{job.aiNote}</p>
          {job.confidence < 80 && (
            <div className="mt-3 pt-3 border-t border-violet-400/15">
              <p className="text-amber-400 text-xs font-semibold">⚠ Review recommended before confirming with customer</p>
            </div>
          )}
        </div>

        {/* Estimate */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-3">Estimate</h3>
          <p className="text-foreground text-2xl font-bold">{fmtRange(job.value)}</p>
          <p className="text-muted-foreground text-xs mt-1">AI range based on similar jobs</p>
          <div className="flex gap-2 mt-4">
            <Btn size="sm" variant="primary"><FileText size={12} /> Create quote</Btn>
          </div>
        </div>
      </div>

      {/* Source + actions row */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground text-sm font-semibold mb-4">Job timeline</h3>
        <div className="space-y-0">
          {[
            { type: "call", desc: "Call received — AI answered and captured job details", time: job.date + " " + job.time.replace(":00", ":05 AM").replace("AM", "AM (approx.)") },
            { type: "job", desc: `Job created by AI — ${job.status}`, time: job.date + " (auto)" },
            { type: "sms", desc: "Booking confirmation SMS sent to customer", time: job.date + " (auto)" },
          ].map((e, i) => (
            <TimelineItem key={i} type={e.type} desc={e.desc} time={e.time} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMERS LIST ───────────────────────────────────────────────────────────

function CustomersScreen({ onNavigate, onSelect }: { onNavigate: (s: Screen, id?: string) => void; onSelect: (id: string) => void }) {
  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground text-xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{CUSTOMERS.length} customers · $11,269 combined value</p>
        </div>
        <Btn variant="primary"><Plus size={14} /> New customer</Btn>
      </div>

      <div className="grid grid-cols-12 gap-3 px-4 pb-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        <span className="col-span-3">Customer</span>
        <span className="col-span-1">Suburb</span>
        <span className="col-span-2">Type</span>
        <span className="col-span-2">Last contact</span>
        <span className="col-span-1">Value</span>
        <span className="col-span-1">Jobs</span>
        <span className="col-span-2">Action</span>
      </div>

      <div className="space-y-1.5">
        {CUSTOMERS.map(c => (
          <div
            key={c.id}
            className="grid grid-cols-12 gap-3 items-center px-4 py-3.5 bg-card border border-border rounded-xl hover:border-border/60 cursor-pointer transition-colors"
            onClick={() => { onSelect(c.id); onNavigate("customer-detail"); }}
          >
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-sm font-bold">{c.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">{c.name}</p>
                <p className="text-muted-foreground text-xs">{c.phone}</p>
              </div>
            </div>
            <div className="col-span-1"><p className="text-foreground text-sm">{c.suburb}</p></div>
            <div className="col-span-2">
              <Badge
                label={c.type}
                cls={c.type === "VIP" ? "text-amber-400 bg-amber-400/10" : c.type === "New lead" ? "text-blue-400 bg-blue-400/10" : "text-slate-400 bg-slate-400/10"}
              />
            </div>
            <div className="col-span-2"><p className="text-muted-foreground text-sm">{c.lastContact}</p></div>
            <div className="col-span-1"><p className="text-foreground text-sm font-medium">{c.lifetimeValue > 0 ? fmt(c.lifetimeValue) : "—"}</p></div>
            <div className="col-span-1">
              {c.openJobs > 0 ? (
                <span className="text-blue-400 text-sm font-medium">{c.openJobs} open</span>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </div>
            <div className="col-span-2" onClick={e => e.stopPropagation()}>
              <Btn size="sm" variant="secondary" onClick={() => { onSelect(c.id); onNavigate("customer-detail"); }}>
                <Eye size={12} /> Profile
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CUSTOMER DETAIL ──────────────────────────────────────────────────────────

function CustomerDetailScreen({ customerId, onBack }: { customerId: string; onBack: () => void }) {
  const c = CUSTOMERS.find(x => x.id === customerId) ?? CUSTOMERS[0];
  const [tab, setTab] = useState("Timeline");
  const [showDupWarning, setShowDupWarning] = useState(c.id === "c6"); // demo: Emma Roberts is a new lead who may match

  return (
    <div className="p-7 space-y-6">
      <div>
        <button className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground mb-4 transition-colors" onClick={onBack}>
          <ChevronLeft size={16} /> Back to customers
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center">
              <span className="text-blue-400 text-xl font-bold">{c.name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-foreground text-2xl font-bold">{c.name}</h1>
                <Badge
                  label={c.type}
                  cls={c.type === "VIP" ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "text-slate-400 bg-slate-400/10"}
                />
              </div>
              <p className="text-muted-foreground text-sm mt-1">{c.suburb} · {c.phone} · {c.email}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {c.tags.map(tag => (
                  <span key={tag} className="text-xs text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="primary"><Phone size={14} /> Call</Btn>
            <Btn variant="secondary"><MessageSquare size={14} /> SMS</Btn>
            <Btn variant="secondary"><Plus size={14} /> New job</Btn>
          </div>
        </div>
      </div>

      {/* Duplicate customer warning */}
      {showDupWarning && (
        <div className="bg-amber-400/6 border border-amber-400/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-400 text-sm font-semibold mb-0.5">Possible duplicate customer</p>
            <p className="text-foreground text-xs leading-relaxed">
              An "Emma R." in Beechworth appears in your call history from a few months ago with the same phone number (0432 567 890). This might be the same person.
            </p>
            <div className="flex gap-2 mt-3">
              <Btn size="sm" variant="secondary"><Users size={12} /> Merge records</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setShowDupWarning(false)}>Keep separate</Btn>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Lifetime value", value: c.lifetimeValue > 0 ? fmt(c.lifetimeValue) : "New" },
          { label: "Open jobs", value: String(c.openJobs) },
          { label: "Last contact", value: c.lastContact },
          { label: "Customer since", value: "2024" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="text-foreground text-xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* AI summary */}
      <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={14} className="text-violet-400" />
          <span className="text-violet-400 text-sm font-semibold">AI customer summary</span>
        </div>
        <p className="text-foreground text-sm leading-relaxed">{c.aiSummary}</p>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border pb-3 mb-5">
          {["Timeline", "Jobs", "Quotes", "Notes"].map(t => (
            <button
              key={t}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Timeline" && (
          <div className="max-w-xl">
            {c.timeline.map((e, i) => (
              <TimelineItem key={i} type={e.type} desc={e.desc} time={e.time} />
            ))}
          </div>
        )}

        {tab === "Jobs" && (
          <div className="space-y-2">
            {JOBS.filter(j => j.customerId === c.id).map(job => (
              <div key={job.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{job.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{job.date} · {job.time} · {job.suburb}</p>
                </div>
                <Badge label={job.status} cls={statusStyle(job.status)} />
                <span className="text-foreground text-sm font-medium">{fmtRange(job.value)}</span>
              </div>
            ))}
            {JOBS.filter(j => j.customerId === c.id).length === 0 && (
              <p className="text-muted-foreground text-sm">No jobs yet.</p>
            )}
          </div>
        )}

        {tab === "Quotes" && (
          <div className="space-y-2">
            {QUOTES.filter(q => q.customerId === c.id).map(q => (
              <div key={q.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{q.num} · {q.jobType}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{q.created}</p>
                </div>
                <Badge label={q.status} cls={statusStyle(q.status)} />
                <span className="text-foreground text-sm font-medium">{fmtRange(q.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Notes" && (
          <div className="bg-card border border-border rounded-xl p-4">
            <textarea
              className="w-full bg-transparent text-foreground text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
              rows={5}
              placeholder="Add internal notes about this customer…"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QUOTES LIST ──────────────────────────────────────────────────────────────

function QuotesScreen({ onNavigate, onSelect }: { onNavigate: (s: Screen, id?: string) => void; onSelect: (id: string) => void }) {
  const { quotes } = useQuotes();
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Needs approval", "Sent", "Follow-up due", "Accepted"];

  const filtered = quotes.filter(q => {
    if (filter === "All") return true;
    return q.status === filter;
  });

  const pendingValue = quotes.filter(q => q.status === "Needs approval").reduce((s, q) => s + q.amount[1], 0);

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground text-xl font-bold">Quotes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {quotes.length} quotes · <span className="text-amber-400 font-medium">2 need approval</span> · {fmt(pendingValue)} pending revenue
          </p>
        </div>
        <Btn variant="primary" onClick={() => onNavigate("quote-builder")}><Plus size={14} /> New quote</Btn>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-border pb-4">
        {filters.map(f => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(q => {
          const needsAction = q.status === "Needs approval" || q.status === "Follow-up due";
          return (
            <div
              key={q.id}
              className={`px-5 py-4 bg-card border rounded-2xl cursor-pointer transition-all hover:border-border/60 ${
                q.status === "Needs approval" ? "border-amber-400/25" : q.status === "Follow-up due" ? "border-amber-400/15" : "border-border"
              }`}
              onClick={() => { onSelect(q.id); onNavigate("quote-detail"); }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-blue-400 text-xs font-semibold">{q.num}</span>
                    <Badge label={q.status} cls={statusStyle(q.status)} />
                    {q.followUp && (
                      <span className="text-amber-400 text-[11px] font-semibold flex items-center gap-0.5">
                        <AlertTriangle size={10} /> Follow-up due today
                      </span>
                    )}
                  </div>
                  <p className="text-foreground font-semibold text-sm">{q.customer}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{q.jobType} · {q.created}</p>
                  {needsAction && q.aiReason && (
                    <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed line-clamp-1">
                      <span className="text-violet-400">AI:</span> {q.aiReason.split(".")[0]}.
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                  <p className="text-foreground font-bold text-lg leading-none">{fmtRange(q.amount)}</p>
                  <div onClick={e => e.stopPropagation()}>
                    {q.status === "Needs approval" ? (
                      <Btn size="sm" variant="primary" onClick={() => { onSelect(q.id); onNavigate("quote-detail"); }}>
                        <Check size={12} /> Approve & send
                      </Btn>
                    ) : q.status === "Follow-up due" ? (
                      <Btn size="sm" variant="secondary" onClick={() => { onSelect(q.id); onNavigate("quote-detail"); }}>
                        <Send size={12} /> Send follow-up
                      </Btn>
                    ) : q.status === "Accepted" ? (
                      <Btn size="sm" variant="secondary" onClick={() => { onSelect(q.id); onNavigate("quote-detail"); }}>
                        <Briefcase size={12} /> Convert to job
                      </Btn>
                    ) : (
                      <Btn size="sm" variant="ghost" onClick={() => { onSelect(q.id); onNavigate("quote-detail"); }}>
                        <Eye size={12} /> View
                      </Btn>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── QUOTE DETAIL ─────────────────────────────────────────────────────────────

function QuoteDetailScreen({
  quoteId, onBack, onNavigate,
}: {
  quoteId: string; onBack: () => void; onNavigate?: (s: Screen, id?: string) => void;
}) {
  const { quotes } = useQuotes();
  const q = quotes.find(x => x.id === quoteId) ?? quotes[0] ?? QUOTES[0];
  const [approved, setApproved] = useState(q.status === "Accepted");
  const [convertStep, setConvertStep] = useState<"idle" | "choosing" | "confirmed">(
    q.status === "Accepted" ? "idle" : "idle"
  );
  const [bookingDate, setBookingDate] = useState("Thursday 26 June");
  const [bookingTime, setBookingTime] = useState("9:00 AM");
  const [jobBooked, setJobBooked] = useState(q.status === "Accepted" && q.num === "Q-1071");
  const conf = confidenceStyle(q.confidence);

  return (
    <div className="p-7 space-y-6">
      <div>
        <button className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground mb-4 transition-colors" onClick={onBack}>
          <ChevronLeft size={16} /> Back to quotes
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-sm font-semibold">{q.num}</span>
              <Badge label={approved ? "Approved" : q.status} cls={approved ? "text-emerald-400 bg-emerald-400/10" : statusStyle(q.status)} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conf.cls}`}>{conf.label}</span>
            </div>
            <h1 className="text-foreground text-2xl font-bold">{q.jobType}</h1>
            <p className="text-muted-foreground text-sm mt-1">{q.customer} · Created {q.created}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Estimated range</p>
            <p className="text-foreground text-3xl font-bold mt-1">{fmtRange(q.amount)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* AI reasoning */}
        <div className="col-span-2 bg-violet-400/5 border border-violet-400/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={14} className="text-violet-400" />
            <span className="text-violet-400 text-sm font-semibold">AI reasoning</span>
          </div>
          <p className="text-foreground text-sm leading-relaxed">{q.aiReason}</p>
        </div>

        {/* Line items */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-foreground text-sm font-semibold mb-3">Estimate items</h3>
          <div className="space-y-2">
            {[
              { label: "Labour", value: fmtRange([q.amount[0] - 100, q.amount[1] - 200]) },
              { label: "Materials", value: fmtRange([100, 200]) },
              { label: "Travel / callout", value: "$0" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
            <div className="pt-2 mt-1 border-t border-border flex justify-between">
              <span className="text-foreground font-semibold text-sm">Total range</span>
              <span className="text-foreground font-bold">{fmtRange(q.amount)}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-[11px] mt-3 leading-relaxed">AI range based on {Math.floor(q.confidence / 10)} similar jobs. Final price confirmed on site.</p>
        </div>
      </div>

      {/* Approval actions — needs approval or follow-up */}
      {!approved && (q.status === "Needs approval" || q.status === "Follow-up due") && (
        <div className="bg-card border border-amber-400/20 rounded-2xl p-5">
          <h3 className="text-foreground text-sm font-semibold mb-1">
            {q.status === "Needs approval" ? "Approve and send quote" : "Send follow-up"}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {q.status === "Needs approval"
              ? "Review the AI estimate above. Once approved, RyanOS will send this to the customer by SMS and email."
              : `${q.customer} hasn't responded in 4 days. AI recommends a polite follow-up today.`}
          </p>
          <div className="flex flex-wrap gap-3">
            <Btn variant="primary" onClick={() => setApproved(true)}>
              <CheckCircle size={14} />
              {q.status === "Needs approval" ? "Approve & send quote" : "Send follow-up SMS"}
            </Btn>
            <Btn variant="secondary"><Edit2 size={14} /> Edit price</Btn>
            <Btn variant="secondary"><Phone size={14} /> Call customer first</Btn>
            <Btn variant="ghost"><XCircle size={14} /> Mark lost</Btn>
          </div>
        </div>
      )}

      {/* Quote sent — awaiting customer response */}
      {(approved || q.status === "Sent") && q.status !== "Accepted" && convertStep === "idle" && !jobBooked && (
        <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-emerald-400 font-semibold text-sm">Quote sent to {q.customer}</p>
              <p className="text-muted-foreground text-xs mt-0.5">SMS and email sent. RyanOS will follow up in 48 hours if no response.</p>
            </div>
          </div>
          <div className="pt-3 border-t border-emerald-400/15">
            <p className="text-foreground text-xs font-medium mb-2">When customer accepts:</p>
            <Btn variant="primary" onClick={() => setConvertStep("choosing")}>
              <Briefcase size={14} /> Mark accepted + convert to job
            </Btn>
          </div>
        </div>
      )}

      {/* Quote accepted — but customer simulated it by SMS/accepting */}
      {(q.status === "Accepted" || q.status === "Follow-up due") && convertStep === "idle" && !jobBooked && q.num === "Q-1079" && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={15} className="text-blue-400" />
            <p className="text-blue-400 font-semibold text-sm">Customer replied about this quote</p>
          </div>
          <p className="text-foreground text-sm mb-3">"Hi, just wondering if the price has changed on that chimney quote? Happy to go ahead."</p>
          <p className="text-muted-foreground text-xs mb-4">Sarah Thompson · SMS · 11:32 AM today</p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" onClick={() => setConvertStep("choosing")}>
              <CheckCircle size={14} /> Mark accepted + book job
            </Btn>
            <Btn variant="secondary"><MessageSquare size={14} /> Reply by SMS</Btn>
          </div>
        </div>
      )}

      {/* Convert to Job — choose booking time */}
      {convertStep === "choosing" && (
        <div className="bg-card border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={15} className="text-emerald-400" />
            <h3 className="text-foreground font-semibold text-sm">Quote accepted — book the job</h3>
          </div>
          <p className="text-muted-foreground text-xs mb-5">Choose a date and time. RyanOS will create the job, update the calendar, and send a confirmation SMS to {q.customer}.</p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-foreground text-xs font-medium block mb-1.5">Booking date</label>
              <div className="relative">
                <select
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                >
                  {["Thursday 26 June", "Friday 27 June", "Monday 30 June", "Tuesday 1 July", "Wednesday 2 July"].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-foreground text-xs font-medium block mb-1.5">Start time</label>
              <div className="relative">
                <select
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                >
                  {["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-secondary rounded-xl p-3.5 mb-5 flex items-start gap-3">
            <Calendar size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground text-sm font-semibold">{q.jobType} — {q.customer}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{bookingDate} · {bookingTime} · {fmtRange(q.amount)}</p>
              <p className="text-muted-foreground text-[11px] mt-1.5">Confirmation SMS will be sent automatically: "Hi {q.customer.split(" ")[0]}, your booking for {q.jobType} is confirmed for {bookingDate} at {bookingTime}. We'll be in touch. — Alpine Fresh"</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Btn variant="primary" onClick={() => setJobBooked(true) || setConvertStep("confirmed")}>
              <Check size={14} /> Confirm booking + send SMS
            </Btn>
            <Btn variant="ghost" onClick={() => setConvertStep("idle")}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Booking confirmed */}
      {(convertStep === "confirmed" || jobBooked) && (
        <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-emerald-400 font-bold text-base">Job booked!</p>
              <p className="text-foreground text-sm mt-0.5">{q.jobType} · {bookingDate} · {bookingTime}</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-4 pl-8">
            <p className="text-foreground text-xs flex items-center gap-2"><Check size={11} className="text-emerald-400" /> Job created in Jobs pipeline</p>
            <p className="text-foreground text-xs flex items-center gap-2"><Check size={11} className="text-emerald-400" /> Calendar updated — {bookingDate} {bookingTime}</p>
            <p className="text-foreground text-xs flex items-center gap-2"><Check size={11} className="text-emerald-400" /> Confirmation SMS sent to {q.customer}</p>
            <p className="text-foreground text-xs flex items-center gap-2"><Check size={11} className="text-emerald-400" /> Quote status updated to Accepted</p>
          </div>
          <div className="flex gap-2">
            {onNavigate && (
              <>
                <Btn size="sm" variant="primary" onClick={() => onNavigate("jobs")}>
                  <Briefcase size={12} /> View job
                </Btn>
                <Btn size="sm" variant="secondary" onClick={() => onNavigate("calendar")}>
                  <Calendar size={12} /> Open calendar
                </Btn>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────

function CalendarScreen() {
  const days = ["Mon 23", "Tue 24", "Wed 25", "Thu 26", "Fri 27", "Sat 28", "Sun 29"];
  const todayIdx = 3;

  const events: Record<number, Array<{ time: string; title: string; customer: string; status: string; value: string; urgent?: boolean }>> = {
    3: [
      { time: "8:30", title: "Hot water repair", customer: "Mick Harris · Wodonga", status: "Confirmed", value: "$380–$650", urgent: true },
      { time: "11:00", title: "Chimney sweep", customer: "Sarah Thompson · Albury", status: "Booked", value: "$299–$399" },
      { time: "14:00", title: "Water tank clean", customer: "Darren Cole · Lavington", status: "Confirmed", value: "$599–$799" },
    ],
    4: [
      { time: "9:00", title: "Roof moss treatment", customer: "Anne McKenzie · Thurgoona", status: "Needs review", value: "$799–$1,200" },
    ],
    6: [
      { time: "10:30", title: "Gutter clean", customer: "Paul Nguyen · Wangaratta", status: "Booked", value: "$250–$350" },
    ],
  };

  const statusColors: Record<string, string> = {
    Confirmed: "bg-emerald-400/15 border-emerald-400/30 text-emerald-400",
    Booked: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    "Needs review": "bg-amber-400/10 border-amber-400/25 text-amber-400",
    Tentative: "bg-violet-400/10 border-violet-400/20 text-violet-400",
  };

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground text-xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Week of 23–29 June · 4 jobs booked</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm"><ChevronLeft size={13} /></Btn>
          <span className="text-foreground text-sm font-medium px-2">June 2025</span>
          <Btn variant="secondary" size="sm"><ChevronRight size={13} /></Btn>
          <Btn variant="primary" size="sm"><Plus size={13} /> Book job</Btn>
        </div>
      </div>

      {/* AI suggestion banner */}
      <div className="bg-violet-400/5 border border-violet-400/15 rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
        <Bot size={14} className="text-violet-400 flex-shrink-0" />
        <p className="text-foreground text-sm">
          <span className="text-violet-400 font-medium">AI suggests:</span> Thursday morning has space near Thurgoona. Moving Anne McKenzie's roof job to 9 AM could work if you approve it today.
        </p>
        <Btn variant="ghost" size="sm">Approve job →</Btn>
      </div>

      {/* Week grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {days.map((day, i) => (
            <div
              key={day}
              className={`px-3 py-3 text-center border-r border-border last:border-r-0 ${i === todayIdx ? "bg-blue-500/8" : ""}`}
            >
              <p className={`text-xs font-medium uppercase tracking-wide ${i === todayIdx ? "text-blue-400" : "text-muted-foreground"}`}>
                {day.split(" ")[0]}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${i === todayIdx ? "text-blue-400" : "text-foreground"}`}>
                {day.split(" ")[1]}
              </p>
              {i === todayIdx && <span className="text-[10px] text-blue-400 font-semibold">Today</span>}
            </div>
          ))}
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-7 min-h-64">
          {days.map((_, i) => (
            <div key={i} className={`border-r border-border last:border-r-0 p-2 space-y-1.5 ${i === todayIdx ? "bg-blue-500/3" : ""}`}>
              {(events[i] || []).map((ev, j) => (
                <div
                  key={j}
                  className={`rounded-lg border px-2.5 py-2 cursor-pointer transition-opacity hover:opacity-80 ${
                    statusColors[ev.status] || "bg-card border-border"
                  }`}
                >
                  <p className="text-[11px] font-bold mb-0.5">{ev.time}</p>
                  <p className="text-[12px] font-semibold leading-tight">{ev.title}</p>
                  <p className="text-[11px] opacity-80 mt-0.5 leading-tight">{ev.customer}</p>
                  <p className="text-[11px] font-medium mt-1">{ev.value}</p>
                  {ev.urgent && <span className="text-[10px] font-bold text-red-400">URGENT</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        {[
          { cls: "bg-emerald-400/15 border-emerald-400/30", label: "Confirmed" },
          { cls: "bg-blue-500/10 border-blue-500/20", label: "Booked" },
          { cls: "bg-amber-400/10 border-amber-400/25", label: "Needs review" },
          { cls: "bg-violet-400/10 border-violet-400/20", label: "AI reserved" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${cls}`} />
            <span className="text-muted-foreground text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────

function AIAssistantScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Good morning, Ryan. I've handled 23 calls today and booked 6 jobs.\n\nYou have 3 items needing attention:\n• Q-1087 (Anne McKenzie) needs your approval before sending\n• Q-1079 (Sarah Thompson) follow-up is due today\n• Missed call from 0499 123 456 — no reply to SMS yet\n\nWhat would you like to do?" },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const PROMPTS = [
    "What jobs do I have today?",
    "Which quotes need follow-up?",
    "Show missed calls this week",
    "How much revenue did we book?",
    "Summarise today",
    "What should I focus on next?",
  ];

  const AI_REPLIES: Record<string, string> = {
    "what jobs do i have today?": "Today's schedule:\n\n• 8:30 AM — Mick Harris, hot water system repair, Wodonga · $380–$650 · Urgent\n• 11:00 AM — Sarah Thompson, chimney sweep, Albury · $299–$399 · Normal\n• 2:00 PM — Darren Cole, water tank clean × 2, Lavington · $599–$799 · Normal\n\nEstimated day value: $1,278–$1,848. First job is 18 minutes from your home address.",
    "which quotes need follow-up?": "Quotes needing action:\n\n• Q-1087 — Anne McKenzie, roof moss treatment $799–$1,200 → Awaiting your approval\n• Q-1086 — Emma Roberts, split system $180–$350 → Awaiting your approval\n• Q-1079 — Sarah Thompson, flue reline $1,100–$1,600 → Follow-up due today (no response in 4 days)\n\nTotal pending revenue: $2,079–$3,150",
    "show missed calls this week": "Missed calls this week:\n\n• 0499 123 456 — today 8:22 AM · Hung up before leaving details · SMS sent, no reply yet\n\nThat's the only missed call this week. AI recovered 3 leads that nearly became missed calls through fast SMS follow-up.",
    "how much revenue did we book?": "Revenue this week:\n\n• Monday: $1,200 (chimney sweep + callout)\n• Tuesday: $2,400 (tank clean + plumbing job)\n• Wednesday: $1,848 (chimney sweep + roof work)\n• Thursday (today): $3,200 booked so far\n\nTotal booked: $8,648 · Up 34% vs last week ($6,450)",
    "summarise today": "Today's summary:\n\n23 calls received · 18 handled by AI · 2 review needed\n6 jobs booked · $3,840–$5,246 estimated value\n2 quotes awaiting your approval\n1 missed call recovered via SMS\n\nAI handled 78% of all calls today without requiring your involvement. 3 items still need your attention.",
    "what should i focus on next?": "Based on what I'm seeing, here's what I'd prioritise:\n\n1. Approve quote Q-1087 (Anne McKenzie, $799–$1,200) — she's waiting\n2. Send follow-up on Q-1079 (Sarah Thompson flue reline) — 4 days no response\n3. Decide on Emma Roberts (Beechworth) — 95 km out, is the travel worth it?\n\nAfter that, you're in good shape for today.",
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: text.trim() }]);
    setInput("");
    setTimeout(() => {
      const key = text.trim().toLowerCase();
      const reply = AI_REPLIES[key] || "I can look that up for you. Try asking about today's jobs, quotes, calls, or revenue — or tell me to draft a message or create a job.";
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
    }, 600);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-7 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-foreground text-xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Ask anything about your business</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-400/8 border border-violet-400/15">
          <Bot size={14} className="text-violet-400" />
          <span className="text-violet-400 text-sm font-medium">RyanOS AI</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <span className="w-8 h-8 rounded-xl bg-violet-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-violet-400" />
              </span>
            )}
            <div
              className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "ai"
                  ? "bg-card border border-border text-foreground rounded-tl-sm"
                  : "bg-blue-500 text-white rounded-tr-sm"
              }`}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-blue-400" />
              </span>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Suggested prompts */}
      <div className="px-7 pb-3 flex gap-2 flex-wrap">
        {PROMPTS.map(p => (
          <button
            key={p}
            className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 hover:text-foreground hover:border-border/60 hover:bg-muted transition-colors"
            onClick={() => send(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-7 pb-6 flex-shrink-0">
        <div className="flex gap-3 items-end bg-card border border-border rounded-2xl px-4 py-3 focus-within:border-blue-500/40 transition-colors">
          <textarea
            className="flex-1 bg-transparent text-foreground text-sm resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed"
            rows={2}
            placeholder="Ask RyanOS anything about your business…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          />
          <button
            className="w-8 h-8 rounded-xl bg-blue-500 hover:bg-blue-400 flex items-center justify-center flex-shrink-0 transition-colors"
            onClick={() => send(input)}
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs mt-2 text-center">RyanOS AI will ask for confirmation before sending messages or changing bookings.</p>
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function SettingsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [section, setSection] = useState("Business profile");
  const [aiAnswerCalls, setAiAnswerCalls] = useState(true);
  const [aiAutoBook, setAiAutoBook] = useState(true);
  const [aiGivePrice, setAiGivePrice] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [afterHours, setAfterHours] = useState(true);
  const [escalateUrgent, setEscalateUrgent] = useState(true);
  const [escalateMode, setEscalateMode] = useState<"sms" | "sms-call">("sms");
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const sections = [
    "Business profile", "Phone & voice AI", "Services & pricing",
    "Calendar & availability", "Team & access", "Booking rules", "Notifications", "Integrations", "Billing",
  ];

  const [services, setServices] = useState([
    { name: "Chimney sweep", desc: "Wood heater, open fireplace, or flue clean", min: 299, max: 499, callout: 0, on: true },
    { name: "Water tank clean", desc: "Poly or steel tank desludge and sanitise", min: 399, max: 999, callout: 0, on: true },
    { name: "Gutter clean", desc: "Clear leaves, flush downpipes", min: 250, max: 650, callout: 0, on: true },
    { name: "Roof moss treatment", desc: "Moss removal, treatment, and sealer", min: 799, max: 1799, callout: 0, on: true },
    { name: "Emergency callout", desc: "Same-day urgent response surcharge", min: 180, max: 280, callout: 180, on: true },
    { name: "HVAC service / repair", desc: "Split system, ducted, evaporative", min: 180, max: 550, callout: 0, on: false },
    { name: "Plumbing", desc: "Blocked drains, hot water, burst pipes", min: 250, max: 850, callout: 0, on: false },
  ]);

  const [calSettings, setCalSettings] = useState({
    mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
    startHour: "7:00 AM", endHour: "5:00 PM",
    bufferMins: 30,
    maxJobsPerDay: 4,
    travelRadiusKm: 60,
    aiCanBook: true,
    aiRequiresApproval: false,
    afterHoursEmergency: true,
  });

  function Toggle({ on, onToggle, label, desc }: { on: boolean; onToggle: () => void; label: string; desc: string }) {
    return (
      <div className="flex items-start gap-4 py-4 border-b border-border last:border-b-0">
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">{label}</p>
          <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{desc}</p>
        </div>
        <button
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${on ? "bg-blue-500" : "bg-muted"}`}
          onClick={onToggle}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Settings sidebar */}
      <div className="w-52 border-r border-border px-3 py-6 flex-shrink-0">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide px-3 mb-2">Settings</p>
        {sections.map(s => (
          <button
            key={s}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
              section === s ? "bg-blue-500/10 text-blue-400" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            onClick={() => setSection(s)}
          >
            {s}
          </button>
        ))}
        <div className="mt-6 px-3 pt-4 border-t border-border">
          <button
            className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
            onClick={() => onNavigate("go-live")}
          >
            Go-live checklist →
          </button>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 p-7 overflow-y-auto">
        {section === "Business profile" && (
          <div className="max-w-lg space-y-5">
            <div>
              <h2 className="text-foreground text-lg font-bold">Business profile</h2>
              <p className="text-muted-foreground text-sm mt-1">Basic details about your business used by the AI receptionist.</p>
            </div>
            {[
              { label: "Business name", value: "Alpine Fresh Property Maintenance" },
              { label: "ABN", value: "52 123 456 789" },
              { label: "Owner name", value: "Ryan Thomas" },
              { label: "Phone number", value: "02 6041 1234" },
              { label: "Email", value: "ryan@alpinefresh.com.au" },
              { label: "Website", value: "alpinefresh.com.au" },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="text-foreground text-sm font-medium block mb-1.5">{label}</label>
                <input
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 transition-colors"
                  defaultValue={value}
                />
              </div>
            ))}
            <Btn variant="primary">Save changes</Btn>
          </div>
        )}

        {section === "Phone & voice AI" && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-foreground text-lg font-bold">Phone, SMS & Email</h2>
                <p className="text-muted-foreground text-sm mt-1">How RyanOS handles calls, texts, and email enquiries for your business.</p>
              </div>

              {/* ── PHONE ───────────────────────────────────────────────── */}
              <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                {/* Status */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-semibold">Phone — AI answers calls</p>
                    <p className="text-muted-foreground text-xs mt-0.5">02 6041 1234 · Inbound calls go to AI first</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium">Active</span>
                  </div>
                </div>

                {/* Greeting */}
                <div className="p-4">
                  <label className="text-foreground text-xs font-semibold block mb-1">AI greeting</label>
                  <p className="text-muted-foreground text-xs mb-2">What the AI says when it answers your phone.</p>
                  <textarea
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 resize-none"
                    rows={3}
                    defaultValue="Thanks for calling Alpine Fresh — this is the AI assistant. I can help book a job or take a message. How can I help today?"
                  />
                </div>

                {/* AI call toggles */}
                <div className="px-4 divide-y divide-border">
                  <Toggle on={aiAnswerCalls} onToggle={() => setAiAnswerCalls(v => !v)}
                    label="AI picks up every call"
                    desc="Turn off to stop AI answering — calls will go to your normal voicemail instead."
                  />
                  <Toggle on={aiAutoBook} onToggle={() => setAiAutoBook(v => !v)}
                    label="AI can book jobs on the spot"
                    desc="AI locks in a time with the customer directly. Turn off to make AI take details and wait for you to confirm."
                  />
                  <Toggle on={aiGivePrice} onToggle={() => setAiGivePrice(v => !v)}
                    label="AI can give rough price ranges"
                    desc="AI tells customers a ballpark price based on your pricing rules. It always says the final price is confirmed on site."
                  />
                  <Toggle on={afterHours} onToggle={() => setAfterHours(v => !v)}
                    label="AI answers after hours too"
                    desc="Outside your working hours, AI still picks up, takes details, and flags urgent jobs to you."
                  />
                </div>

                {/* Test */}
                <div className="p-4">
                  <Btn size="sm" variant="secondary">Make a test call</Btn>
                  <p className="text-muted-foreground text-xs mt-2">Call your number from another phone to hear the AI greeting and test a booking.</p>
                </div>
              </div>

              {/* ── SMS ALERTS ──────────────────────────────────────────── */}
              <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-semibold">SMS alerts — urgent jobs</p>
                    <p className="text-muted-foreground text-xs mt-0.5">RyanOS texts you when something needs your attention</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium">Active</span>
                  </div>
                </div>

                {/* Alert number */}
                <div className="p-4">
                  <label className="text-foreground text-xs font-semibold block mb-1">Your mobile number for alerts</label>
                  <p className="text-muted-foreground text-xs mb-2">RyanOS will text this number when a job needs your decision.</p>
                  <input
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                    defaultValue="0412 987 654"
                  />
                </div>

                {/* Alert mode */}
                <div className="p-4">
                  <label className="text-foreground text-xs font-semibold block mb-3">How should RyanOS alert you for emergencies?</label>
                  <div className="space-y-2">
                    {([
                      { id: "sms" as const, label: "SMS only", desc: "RyanOS sends you a text message. Good for most urgent jobs." },
                      { id: "sms-call" as const, label: "SMS + follow-up call", desc: "RyanOS texts you first, then calls you 2 minutes later if you haven't responded. Best for burst pipes, gas leaks, or safety emergencies." },
                    ]).map(opt => (
                      <div
                        key={opt.id}
                        className={`px-4 py-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${escalateMode === opt.id ? "bg-blue-500/8 border-blue-500/20" : "bg-secondary border-border hover:border-border/60"}`}
                        onClick={() => setEscalateMode(opt.id)}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${escalateMode === opt.id ? "border-blue-500 bg-blue-500" : "border-border"}`}>
                          {escalateMode === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${escalateMode === opt.id ? "text-blue-400" : "text-foreground"}`}>{opt.label}</p>
                          <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 divide-y divide-border">
                  <Toggle on={escalateUrgent} onToggle={() => setEscalateUrgent(v => !v)}
                    label="Alert me immediately for urgent calls"
                    desc="If AI detects a burst pipe, emergency, or safety risk, you get alerted straight away — day or night."
                  />
                  <Toggle on={requireApproval} onToggle={() => setRequireApproval(v => !v)}
                    label="Text me before sending a quote to a customer"
                    desc="AI drafts the quote but waits for your OK before it goes out."
                  />
                </div>
              </div>

              {/* ── EMAIL ───────────────────────────────────────────────── */}
              <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-400/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-semibold">Email enquiries</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Customer emails appear in your RyanOS Inbox alongside calls and SMS</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium">Active</span>
                  </div>
                </div>

                {/* How it works explanation */}
                <div className="p-4 bg-secondary/50">
                  <p className="text-foreground text-xs font-semibold mb-1.5">How it works</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Keep using your normal business email as usual — you don't need to change anything customers already know. Just set up a forward rule so customer enquiries also come into RyanOS. RyanOS will read them, summarise them, and suggest a reply — just like a call.
                  </p>
                </div>

                {/* Your business email */}
                <div className="p-4">
                  <label className="text-foreground text-xs font-semibold block mb-1">Your business email address</label>
                  <p className="text-muted-foreground text-xs mb-2">The email your customers already use to contact you. This does not change.</p>
                  <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3.5 py-2.5">
                    <Mail size={13} className="text-muted-foreground flex-shrink-0" />
                    <input className="flex-1 bg-transparent text-foreground text-sm focus:outline-none" defaultValue="info@alpinefresh.com.au" />
                  </div>
                </div>

                {/* RyanOS forwarding address */}
                <div className="p-4">
                  <label className="text-foreground text-xs font-semibold block mb-1">RyanOS forwarding address</label>
                  <p className="text-muted-foreground text-xs mb-2">
                    Set up a forward rule in your email so messages from customers also arrive here. You can ask your internet provider or email host to set this up — it takes 2 minutes.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-secondary border border-border rounded-xl px-3.5 py-2.5">
                      <span className="text-muted-foreground text-xs font-mono truncate">alpine-fresh@inbox.ryanos.app</span>
                    </div>
                    <button
                      className="px-3.5 py-2.5 rounded-xl bg-muted border border-border text-xs font-semibold transition-colors hover:bg-accent"
                      style={{ color: copied ? "#3CCF91" : undefined }}
                      onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-2">
                    This is a private address — not for sharing publicly. It is only used to receive forwarded copies of customer emails.
                  </p>
                </div>

                {/* Test + status */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-xs font-semibold">Send a test email</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {testSent ? "Test sent — check your RyanOS Inbox in a moment." : "Make sure forwarding is working correctly."}
                      </p>
                    </div>
                    <Btn size="sm" variant="secondary" onClick={() => setTestSent(true)}>
                      {testSent ? "Sent ✓" : "Send test"}
                    </Btn>
                  </div>
                  {testSent && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-400/6 border border-emerald-400/15 rounded-xl">
                      <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                      <p className="text-emerald-400 text-xs font-medium">Last test received · Today 11:47 AM · 4 seconds</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── GO-LIVE STATUS ──────────────────────────────────────── */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-foreground text-sm font-semibold mb-3">Connection status</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Phone — AI answering calls", active: aiAnswerCalls },
                    { label: "SMS alerts to 0412 987 654", active: true },
                    { label: "Emergency escalation", active: escalateUrgent },
                    { label: "Email inbox forwarding", active: true },
                  ].map(({ label, active }) => (
                    <div key={label} className="flex items-center gap-3">
                      {active
                        ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                        : <div className="w-3.5 h-3.5 rounded-full border-2 border-border flex-shrink-0" />
                      }
                      <p className={`text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
                      <span className={`ml-auto text-[11px] font-semibold ${active ? "text-emerald-400" : "text-slate-400"}`}>
                        {active ? "Active" : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Btn variant="primary">Save settings</Btn>
            </div>
        )}

        {section === "Services & pricing" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-foreground text-lg font-bold">Services & pricing</h2>
              <p className="text-muted-foreground text-sm mt-1">Turn on the services you offer and set your price range. The AI uses these to give customers a rough estimate during calls.</p>
            </div>

            {/* Service cards */}
            <div className="space-y-2">
              {services.map((svc, i) => (
                <div key={svc.name} className={`bg-card border rounded-2xl transition-all ${svc.on ? "border-border" : "border-border/40 opacity-60"}`}>
                  {/* Service header row — toggle + name + delete */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Square on/off checkbox */}
                    <button
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        svc.on
                          ? "bg-blue-500 border-blue-500"
                          : "bg-transparent border-border hover:border-blue-400/60"
                      }`}
                      onClick={() => setServices(prev => prev.map((s, j) => j === i ? { ...s, on: !s.on } : s))}
                      title={svc.on ? "Turn off" : "Turn on"}
                    >
                      {svc.on && <Check size={13} className="text-white" strokeWidth={3} />}
                    </button>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-semibold leading-none">{svc.name}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{svc.desc}</p>
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${svc.on ? "text-emerald-400 bg-emerald-400/10" : "text-slate-400 bg-slate-400/10"}`}>
                      {svc.on ? "Active" : "Off"}
                    </span>

                    {/* Delete */}
                    <button
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                      title="Remove service"
                      onClick={() => setServices(prev => prev.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Pricing inputs — shown when active */}
                  {svc.on && (
                    <div className="px-4 pb-4 pt-1 border-t border-border">
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="text-muted-foreground text-[11px] font-medium block mb-1.5">Lowest price ($)</label>
                          <input
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                            type="number"
                            value={svc.min}
                            onChange={e => setServices(prev => prev.map((s, j) => j === i ? { ...s, min: Number(e.target.value) } : s))}
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground text-[11px] font-medium block mb-1.5">Highest price ($)</label>
                          <input
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                            type="number"
                            value={svc.max}
                            onChange={e => setServices(prev => prev.map((s, j) => j === i ? { ...s, max: Number(e.target.value) } : s))}
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground text-[11px] font-medium block mb-1.5">Callout fee ($)</label>
                          <input
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                            type="number"
                            value={svc.callout}
                            placeholder="0"
                            onChange={e => setServices(prev => prev.map((s, j) => j === i ? { ...s, callout: Number(e.target.value) } : s))}
                          />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-2.5 leading-relaxed">
                        AI will tell customers:{" "}
                        <span className="text-foreground italic">
                          "{svc.min > 0 ? `$${svc.min.toLocaleString()} to $${svc.max.toLocaleString()}` : "price depends on the job"}{svc.callout > 0 ? `, plus a $${svc.callout} callout fee` : ""} depending on the job."
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add service */}
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border border-dashed border-border rounded-2xl text-muted-foreground text-sm font-medium hover:text-foreground hover:border-border/80 transition-colors"
              onClick={() => setServices(prev => [...prev, {
                name: "New service",
                desc: "Describe this service",
                min: 0, max: 0, callout: 0, on: true,
              }])}
            >
              <Plus size={15} /> Add service
            </button>

            {/* Global rules */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-foreground text-sm font-semibold">Pricing rules</h3>
              {[
                { label: "After-hours surcharge", desc: "Added to jobs outside business hours", value: "$150" },
                { label: "Emergency surcharge", desc: "Same-day emergency response", value: "$180" },
                { label: "Travel fee (per km over 60 km)", desc: "For jobs outside your normal radius", value: "$1.80/km" },
              ].map(({ label, desc, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">{desc}</p>
                  </div>
                  <input
                    className="w-28 bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-foreground text-sm text-right focus:outline-none focus:border-blue-500/40"
                    defaultValue={value}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Btn variant="primary">Save pricing</Btn>
              <Btn variant="secondary"><Upload size={14} /> Upload past invoices</Btn>
            </div>
          </div>
        )}

        {section === "Calendar & availability" && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="text-foreground text-lg font-bold">Calendar & availability</h2>
              <p className="text-muted-foreground text-sm mt-1">Set when you work and how the AI books jobs. These rules control what time slots the AI can offer customers.</p>
            </div>

            {/* Working days */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-foreground text-sm font-semibold mb-4">Working days</h3>
              <div className="flex gap-2 flex-wrap">
                {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map(day => (
                  <button
                    key={day}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                      calSettings[day]
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                    onClick={() => setCalSettings(prev => ({ ...prev, [day]: !prev[day] }))}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-foreground text-sm font-semibold mb-4">Working hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground text-xs font-medium block mb-1.5">Start time</label>
                  <div className="relative">
                    <select
                      className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                      value={calSettings.startHour}
                      onChange={e => setCalSettings(p => ({ ...p, startHour: e.target.value }))}
                    >
                      {["6:00 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM"].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-foreground text-xs font-medium block mb-1.5">End time</label>
                  <div className="relative">
                    <select
                      className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                      value={calSettings.endHour}
                      onChange={e => setCalSettings(p => ({ ...p, endHour: e.target.value }))}
                    >
                      {["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking limits */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-foreground text-sm font-semibold">Booking rules</h3>
              {[
                { key: "bufferMins" as const, label: "Buffer time between jobs (minutes)", desc: "Travel/wrap-up time between bookings", suffix: "min", values: [0, 15, 30, 45, 60] },
                { key: "maxJobsPerDay" as const, label: "Maximum jobs per day", desc: "AI won't book more than this", suffix: "jobs", values: [1, 2, 3, 4, 5, 6] },
                { key: "travelRadiusKm" as const, label: "Service area radius", desc: "AI won't book jobs outside this distance from Albury", suffix: "km", values: [30, 40, 50, 60, 80, 100] },
              ].map(({ key, label, desc, suffix, values }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">{desc}</p>
                  </div>
                  <div className="relative">
                    <select
                      className="bg-secondary border border-border rounded-xl pl-3 pr-8 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                      value={calSettings[key]}
                      onChange={e => setCalSettings(p => ({ ...p, [key]: Number(e.target.value) }))}
                    >
                      {values.map(v => <option key={v} value={v}>{v} {suffix}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            {/* AI booking behaviour — single clear choice */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-foreground text-sm font-semibold mb-1">How should AI handle bookings?</h3>
              <p className="text-muted-foreground text-xs mb-4">Choose how much the AI does on its own when a customer calls and wants to book.</p>
              <div className="space-y-2">
                {[
                  {
                    key: "auto" as const,
                    label: "AI books automatically",
                    desc: "AI locks in the booking straight away. Customer gets a confirmation SMS immediately. You get a notification.",
                    icon: "⚡",
                  },
                  {
                    key: "approval" as const,
                    label: "AI reserves a slot — I approve first",
                    desc: "AI tells the customer a time is available, but holds it as tentative until you confirm. Best of both worlds.",
                    icon: "✅",
                  },
                  {
                    key: "manual" as const,
                    label: "AI takes details only — I book manually",
                    desc: "AI collects the customer's job details and contacts. You review and book yourself. Full control.",
                    icon: "👤",
                  },
                ].map(({ key, label, desc, icon }) => {
                  const selected = key === "auto" ? (calSettings.aiCanBook && !calSettings.aiRequiresApproval) : key === "approval" ? calSettings.aiRequiresApproval : (!calSettings.aiCanBook && !calSettings.aiRequiresApproval);
                  return (
                    <div
                      key={key}
                      className={`px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${selected ? "bg-blue-500/8 border-blue-500/20" : "bg-secondary border-border hover:border-border/60"}`}
                      onClick={() => setCalSettings(p => ({
                        ...p,
                        aiCanBook: key === "auto",
                        aiRequiresApproval: key === "approval",
                      }))}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${selected ? "text-blue-400" : "text-foreground"}`}>{label}</p>
                          <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                        {selected && <CheckCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5 ml-auto" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* After-hours emergency */}
            <div className="bg-card border border-border rounded-xl px-5 py-1">
              <div className="flex items-start gap-4 py-4">
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">Take emergency calls outside business hours</p>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">If someone calls about a burst pipe, gas leak, or urgent repair outside your working hours, AI still takes their details and alerts you by SMS immediately.</p>
                </div>
                <button
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${calSettings.afterHoursEmergency ? "bg-blue-500" : "bg-muted"}`}
                  onClick={() => setCalSettings(p => ({ ...p, afterHoursEmergency: !p.afterHoursEmergency }))}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${calSettings.afterHoursEmergency ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {/* Plain English summary */}
            <div className="bg-secondary border border-border rounded-xl p-4">
              <p className="text-muted-foreground text-xs font-semibold mb-1.5">Current settings summary</p>
              <p className="text-foreground text-sm leading-relaxed">
                AI answers calls {calSettings.mon && calSettings.fri ? "Monday to Friday" : "on selected days"}, {calSettings.startHour} to {calSettings.endHour}.
                Maximum {calSettings.maxJobsPerDay} jobs per day with {calSettings.bufferMins} minutes between jobs.
                Service area: {calSettings.travelRadiusKm} km from Albury.
                {calSettings.aiCanBook && !calSettings.aiRequiresApproval
                  ? " AI books automatically."
                  : calSettings.aiRequiresApproval
                  ? " AI reserves slots — you approve before confirming."
                  : " AI takes details only — you book manually."}
                {calSettings.afterHoursEmergency ? " Emergency calls handled 24/7." : ""}
              </p>
            </div>

            <Btn variant="primary">Save availability settings</Btn>
          </div>
        )}

        {section === "Team & access" && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="text-foreground text-lg font-bold">Team & access</h2>
              <p className="text-muted-foreground text-sm mt-1">Control who can see what. Field staff get a simplified view — jobs only, no pricing or business data.</p>
            </div>

            {/* Team members */}
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {[
                { name: "Ryan Thomas", role: "Owner", initials: "RT", color: "bg-emerald-400/15 text-emerald-400" },
                { name: "Mike Cooper", role: "Field Technician", initials: "MC", color: "bg-blue-500/15 text-blue-400" },
              ].map(({ name, role, initials, color }) => (
                <div key={name} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${color}`}>
                    {initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-semibold">{name}</p>
                    <p className="text-muted-foreground text-xs">{role}</p>
                  </div>
                  <Btn size="sm" variant="ghost"><Edit2 size={12} /> Edit</Btn>
                </div>
              ))}
              <div className="px-5 py-3.5">
                <Btn size="sm" variant="secondary" full><Plus size={13} /> Add team member</Btn>
              </div>
            </div>

            {/* What field techs can and cannot see */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-foreground text-sm font-semibold mb-1">Field technician access</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">When a team member logs in as "Field Technician" on mobile, they only see what they need to do their job.</p>
              <div className="space-y-3">
                {[
                  { label: "Today's assigned jobs", allowed: true },
                  { label: "Customer name and address", allowed: true },
                  { label: "Job instructions and notes", allowed: true },
                  { label: "Add on-site notes and photos", allowed: true },
                  { label: "Add materials used", allowed: true },
                  { label: "Mark job complete", allowed: true },
                  { label: "Quote prices or profit margin", allowed: false },
                  { label: "Customer lifetime value or history", allowed: false },
                  { label: "Inbox, calls, or SMS log", allowed: false },
                  { label: "Invoices or payment status", allowed: false },
                  { label: "Revenue or business analytics", allowed: false },
                  { label: "AI settings or pricing rules", allowed: false },
                  { label: "Business settings", allowed: false },
                ].map(({ label, allowed }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${allowed ? "bg-emerald-400/15 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                      {allowed ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                    </span>
                    <p className={`text-sm ${allowed ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech PIN/login note */}
            <div className="bg-secondary border border-border rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-xs leading-relaxed">
                On the RyanOS mobile app, a "Who are you?" screen appears first. Field staff tap "Field Technician" to get the simplified view. Owner/admin tap "Owner / Manager" for full access.
              </p>
            </div>
          </div>
        )}

        {!["Business profile", "Phone & voice AI", "Services & pricing", "Calendar & availability", "Team & access"].includes(section) && (
          <div className="max-w-lg">
            <h2 className="text-foreground text-lg font-bold">{section}</h2>
            <p className="text-muted-foreground text-sm mt-2">This section is available in the next update.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GO-LIVE CHECKLIST ────────────────────────────────────────────────────────

function GoLiveScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const items = [
    { label: "Business profile complete", done: true, required: true },
    { label: "Services and pricing added", done: true, required: true },
    { label: "Service area configured", done: true, required: true },
    { label: "Business hours set", done: true, required: true },
    { label: "Phone number connected", done: true, required: true },
    { label: "AI greeting configured", done: true, required: true },
    { label: "Emergency handling rules approved", done: true, required: true },
    { label: "Test call completed", done: true, required: true },
    { label: "Owner notification method set", done: true, required: true },
    { label: "Past invoices uploaded (optional)", done: false, required: false },
    { label: "SMS templates reviewed (optional)", done: false, required: false },
    { label: "Calendar availability set (optional)", done: false, required: false },
  ];

  const requiredDone = items.filter(i => i.required && i.done).length;
  const requiredTotal = items.filter(i => i.required).length;
  const pct = Math.round((requiredDone / requiredTotal) * 100);
  const ready = pct === 100;

  return (
    <div className="p-7 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-bold">Go-live checklist</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete these steps before the AI starts answering your calls.</p>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-foreground font-semibold text-sm">Setup progress</p>
          <span className={`text-lg font-bold ${ready ? "text-emerald-400" : "text-blue-400"}`}>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${ready ? "bg-emerald-400" : "bg-blue-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs mt-2">{requiredDone}/{requiredTotal} required steps complete</p>
      </div>

      {/* Checklist */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border mb-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.done ? "bg-emerald-400/15 text-emerald-400" : "bg-muted text-muted-foreground"
            }`}>
              {item.done ? <Check size={11} /> : <span className="w-2 h-2 rounded-full bg-border" />}
            </div>
            <span className={`text-sm flex-1 ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
              {item.label}
            </span>
            {!item.required && <Badge label="Optional" cls="text-slate-400 bg-slate-400/10" />}
            {!item.done && item.required && (
              <button
                className="text-blue-400 text-xs font-semibold hover:text-blue-300 transition-colors"
                onClick={() => onNavigate("settings")}
              >
                Set up →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Go live */}
      {ready && (
        <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-6 text-center">
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
          <h2 className="text-foreground text-xl font-bold">RyanOS is ready to go live</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-5">Your AI receptionist will start answering calls for Alpine Fresh.</p>
          <Btn variant="primary">
            <Zap size={16} /> Go live now
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─── INBOX SCREEN ────────────────────────────────────────────────────────────

function InboxScreen({ onNavigate, onSelect, initialFilter, initialConvId }: { onNavigate: (s: Screen, id?: string) => void; onSelect: (id: string) => void; initialFilter?: string; initialConvId?: string }) {
  const { conversations, refresh: refreshConversations } = useConversations();
  const [activeId, setActiveId] = useState(() => {
    if (initialConvId && INBOX.find(c => c.id === initialConvId)) return initialConvId;
    return INBOX[0].id;
  });
  const [filter, setFilter] = useState(initialFilter || "All");
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sentReplies, setSentReplies] = useState<Record<string, InboxMsg[]>>({});
  const [msgPreview, setMsgPreview] = useState<{ recipient: string; channel: "sms" | "email"; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);


  const isCalls = filter === "Calls";
  const conv = conversations.find(c => c.id === activeId) ?? conversations[0] ?? INBOX[0];
  const activeCall = isCalls ? (CALLS.find(c => c.id === activeCallId) ?? null) : null;

  const reviewCount = conversations.filter(c => c.status === "needs-human" || c.status === "urgent").length;
  const urgentCount = conversations.filter(c => c.status === "urgent").length;
  const humanCount = conversations.filter(c => c.status === "needs-human").length;
  const unreadCount = conversations.filter(c => c.unread > 0).length;
  const callsNeedReview = CALLS.filter(c => c.needsReview).length;

  const filtered = isCalls ? [] : conversations.filter(c => {
    if (filter === "All") return true;
    if (filter === "Needs review") return c.status === "needs-human" || c.status === "urgent";
    if (filter === "Urgent") return c.status === "urgent";
    if (filter === "Unread") return c.unread > 0;
    if (filter === "Quote replies") return c.status === "quote-reply";
    if (filter === "Done") return c.status === "done";
    return true;
  });

  const channelIcon = (ch: string) => {
    if (ch === "sms") return <MessageSquare size={11} />;
    if (ch === "email") return <Mail size={11} />;
    if (ch === "web") return <Globe size={11} />;
    if (ch === "handoff") return <Bot size={11} />;
    return <Phone size={11} />;
  };

  const statusConfig = (s: string) => {
    if (s === "urgent") return { dot: "bg-red-400", label: "Urgent", cls: "text-red-400 bg-red-400/10 border-red-400/20" };
    if (s === "needs-human") return { dot: "bg-amber-400", label: "Needs human", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
    if (s === "quote-reply") return { dot: "bg-blue-400", label: "Quote reply", cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
    if (s === "unread") return { dot: "bg-blue-400", label: "New", cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
    if (s === "ai-handled") return { dot: "bg-emerald-400", label: "AI handled", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
    if (s === "done") return { dot: "bg-muted-foreground", label: "Done", cls: "text-muted-foreground bg-muted/40" };
    return { dot: "bg-blue-400", label: "New", cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
  };

  const allMessages = [
    ...conv.messages,
    ...(sentReplies[conv.id] ?? []),
  ].sort((a, b) => a.id.localeCompare(b.id));

  const sendReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    const localId = `sent-${Date.now()}`;
    const msg: InboxMsg = {
      id: localId,
      from: "customer",
      text: trimmed,
      time: "Just now",
    };
    const convId = conv.id;
    setSentReplies(prev => ({ ...prev, [convId]: [...(prev[convId] ?? []), msg] }));
    setReplyText("");
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 50);
    void sendConversationMessage(convId, trimmed).then(ok => {
      if (!ok) return;
      // Server is now the source of truth for this message. Drop the local
      // optimistic copy so we don't render duplicate bubbles after refresh.
      setSentReplies(prev => {
        const list = prev[convId];
        if (!list) return prev;
        const next = list.filter(m => m.id !== localId);
        if (next.length === list.length) return prev;
        return { ...prev, [convId]: next };
      });
      refreshConversations();
    });
  };

  const chanLabel: Record<string, string> = {
    sms: "SMS", email: "Email", web: "Web form", handoff: "AI escalation", call: "Phone call",
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── LEFT SIDEBAR: Conversation list ───────────────────────────────── */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-sidebar">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-bold text-sm">Inbox</h2>
            <div className="flex items-center gap-1">
              {urgentCount > 0 && (
                <span className="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded-full">
                  {urgentCount} urgent
                </span>
              )}
              {humanCount > 0 && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                  {humanCount} review
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted border border-border">
            <Search size={11} className="text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground text-xs">Search conversations…</span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="px-3 py-2 border-b border-border flex gap-1 flex-wrap">
          {[
            { f: "All", badge: null, urgent: false },
            { f: "Needs review", badge: reviewCount > 0 ? reviewCount : null, urgent: true },
            { f: "Unread", badge: unreadCount > 0 ? unreadCount : null, urgent: false },
            { f: "Quote replies", badge: null, urgent: false },
            { f: "Calls", badge: callsNeedReview > 0 ? callsNeedReview : null, urgent: false },
            { f: "Done", badge: null, urgent: false },
          ].map(({ f, badge, urgent }) => (
            <button
              key={f}
              className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filter === f
                  ? urgent ? "bg-red-400/15 text-red-400" : "bg-blue-500/15 text-blue-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => {
                setFilter(f);
                if (f === "Calls" && !activeCallId) setActiveCallId(CALLS[0]?.id ?? null);
              }}
            >
              {f}
              {badge !== null && (
                <span className={`text-[10px] font-bold rounded-full px-1 ${urgent ? "bg-red-400/20 text-red-400" : "bg-blue-400/20 text-blue-400"}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {/* Inbox conversations */}
          {!isCalls && filtered.map(c => {
            const sc = statusConfig(c.status);
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                className={`px-4 py-3.5 border-b border-border cursor-pointer transition-colors ${isActive ? "bg-blue-500/8 border-l-2 border-l-blue-500" : "hover:bg-muted"}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                      <span className="text-foreground text-xs font-bold">{c.name.charAt(0)}</span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${sc.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-foreground text-xs font-semibold truncate">{c.name}</p>
                      <span className="text-muted-foreground text-[10px] flex-shrink-0">{c.time}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate mb-1.5">{c.preview}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stageColor(c.journey.currentStage)}`}>
                        {c.journey.currentStage}
                      </span>
                      {c.journey.paymentStatus && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${paymentLabel(c.journey.paymentStatus).cls}`}>
                          {paymentLabel(c.journey.paymentStatus).text}
                        </span>
                      )}
                      {c.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Calls list */}
          {isCalls && CALLS.map(call => {
            const isActive = call.id === activeCallId;
            return (
              <div
                key={call.id}
                className={`px-4 py-3.5 border-b border-border cursor-pointer transition-colors ${isActive ? "bg-blue-500/8 border-l-2 border-l-blue-500" : "hover:bg-muted"}`}
                onClick={() => setActiveCallId(call.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${call.outcome === "Booked" ? "bg-emerald-400/10 border-emerald-400/20" : call.outcome === "Missed" ? "bg-red-400/10 border-red-400/20" : "bg-amber-400/10 border-amber-400/20"}`}>
                      <Phone size={13} className={call.outcome === "Booked" ? "text-emerald-400" : call.outcome === "Missed" ? "text-red-400" : "text-amber-400"} />
                    </div>
                    {call.needsReview && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-foreground text-xs font-semibold truncate">{call.caller}</p>
                      <span className="text-muted-foreground text-[10px] flex-shrink-0">{call.time}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate mb-1">
                      {call.jobType === "Unknown" ? "No details captured" : call.jobType}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge label={call.outcome} cls={`text-[10px] px-1.5 py-0 ${outcomeStyle(call.outcome)} border`} />
                      {call.confidence > 0 && (
                        <span className={`text-[10px] font-semibold px-1 rounded ${confidenceStyle(call.confidence).cls}`}>
                          {call.confidence}%
                        </span>
                      )}
                      {call.needsReview && <span className="text-[10px] text-amber-400 font-semibold">Review</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* CALLS VIEW */}
        {isCalls && activeCall && (
          <>
            <div className="px-6 py-3.5 border-b border-border flex items-center gap-3 flex-shrink-0 bg-background">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-foreground font-semibold text-sm">{activeCall.caller}</p>
                  <Badge label={activeCall.outcome} cls={`${outcomeStyle(activeCall.outcome)} border text-[11px]`} />
                  {activeCall.confidence > 0 && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${confidenceStyle(activeCall.confidence).cls}`}>
                      {activeCall.confidence}%
                    </span>
                  )}
                  {activeCall.needsReview && (
                    <span className="flex items-center gap-1 text-amber-400 text-[11px] font-semibold">
                      <AlertTriangle size={11} /> Needs review
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {activeCall.phone} · {activeCall.time} · {activeCall.duration}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Btn size="sm" variant="secondary"><Phone size={12} /> Call back</Btn>
                {activeCall.jobCreated && activeCall.jobId && (
                  <Btn size="sm" variant="secondary" onClick={() => { onSelect(activeCall.jobId!); onNavigate("job-detail"); }}>
                    <Briefcase size={12} /> View job
                  </Btn>
                )}
                <Btn size="sm" variant="primary" onClick={() => onNavigate("quote-builder")}>
                  <Plus size={12} /> Create quote
                </Btn>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-5 flex gap-3">
                <Bot size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-violet-400 text-xs font-semibold mb-1.5">AI summary</p>
                  <p className="text-foreground text-sm leading-relaxed">{activeCall.summary}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-foreground text-xs font-semibold mb-3 flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-emerald-400" /> Captured details
                  </p>
                  <div className="space-y-2">
                    {[
                      { l: "Name", v: activeCall.extracted.name },
                      { l: "Phone", v: activeCall.extracted.phone },
                      { l: "Address", v: activeCall.extracted.address },
                      { l: "Job type", v: activeCall.extracted.jobType },
                      { l: "Urgency", v: activeCall.extracted.urgency },
                      { l: "Estimate", v: activeCall.extracted.range[0] > 0 ? fmtRange(activeCall.extracted.range) : "—" },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex gap-2">
                        <span className="text-muted-foreground text-xs w-16 flex-shrink-0">{l}</span>
                        <span className="text-foreground text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-foreground text-xs font-semibold mb-3">Transcript</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeCall.transcript.map((line, i) => (
                      <div key={i} className={`flex gap-2 ${line.speaker === "AI" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-xs leading-relaxed ${line.speaker === "AI" ? "bg-violet-400/10 border border-violet-400/15" : "bg-secondary border border-border"}`}>
                          <span className="text-[10px] font-semibold block mb-0.5" style={{ color: line.speaker === "AI" ? "#A78BFA" : "#7F8998" }}>
                            {line.speaker} · {line.time}
                          </span>
                          {line.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-foreground text-xs font-semibold mb-3">Owner actions</p>
                <div className="flex flex-wrap gap-2">
                  {activeCall.jobCreated && activeCall.jobId && (
                    <Btn size="sm" variant="primary" onClick={() => { onSelect(activeCall.jobId!); onNavigate("job-detail"); }}>
                      <CheckCircle size={12} /> Approve booking
                    </Btn>
                  )}
                  <Btn size="sm" variant="secondary"><Phone size={12} /> Call customer</Btn>
                  <Btn size="sm" variant="secondary"><MessageSquare size={12} /> Send SMS</Btn>
                  <Btn size="sm" variant="secondary" onClick={() => onNavigate("quote-builder")}><FileText size={12} /> Create quote</Btn>
                  <Btn size="sm" variant="ghost"><Check size={12} /> Mark resolved</Btn>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Message preview modal — shown before any customer-facing send */}
        {msgPreview && (
          <MessagePreviewModal
            open
            recipient={msgPreview.recipient}
            channel={msgPreview.channel}
            defaultMessage={msgPreview.message}
            onClose={() => setMsgPreview(null)}
            onSend={text => {
              const msg: InboxMsg = { id: `sent-${Date.now()}`, from: "customer", text, time: "Just now" };
              setSentReplies(prev => ({ ...prev, [conv.id]: [...(prev[conv.id] ?? []), msg] }));
              setReplyText("");
              setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
              }, 50);
            }}
          />
        )}

        {/* CONVERSATION SCROLL-DOWN VIEW */}
        {!isCalls && (
          <>
            {/* Sticky header */}
            <div
              className="px-6 py-3.5 border-b border-border flex items-center gap-3 flex-shrink-0 bg-background"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-foreground font-semibold text-sm">{conv.name}</p>
                  <Badge
                    label={statusConfig(conv.status).label}
                    cls={`${statusConfig(conv.status).cls} border text-[11px]`}
                  />
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    {channelIcon(conv.channel)}
                    <span>{chanLabel[conv.channel] ?? conv.channel}</span>
                  </span>
                </div>
                {conv.phone && <p className="text-muted-foreground text-xs mt-0.5">{conv.phone}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Btn size="sm" variant="secondary"><Phone size={12} /> Call</Btn>
                <Btn size="sm" variant="secondary"><MessageSquare size={12} /> SMS</Btn>
                <Btn size="sm" variant="primary" onClick={() => onNavigate("quote-builder")}>
                  <Plus size={12} /> Create quote
                </Btn>
                <Btn size="sm" variant="secondary" onClick={() => onNavigate("jobs")}>
                  <Briefcase size={12} /> Create job
                </Btn>
              </div>
            </div>

            {/* Journey tracker — horizontal strip */}
            <div
              className="px-6 py-2.5 border-b border-border flex items-center gap-1 overflow-x-auto flex-shrink-0 bg-sidebar"
            >
              {conv.journey.stages.map((stage, i) => {
                const currentIdx = conv.journey.stages.indexOf(conv.journey.currentStage);
                const isCurrent = stage === conv.journey.currentStage;
                const isDone = i < currentIdx;
                return (
                  <div key={stage} className="flex items-center gap-1 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isCurrent ? "bg-blue-500/10 border border-blue-500/15" : ""}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? "bg-blue-400" : isDone ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                      <span className={`text-[11px] whitespace-nowrap ${isCurrent ? "font-bold text-blue-400" : isDone ? "font-medium text-emerald-400" : "font-medium text-muted-foreground"}`}>
                        {isDone ? "✓ " : ""}{stage}
                      </span>
                    </div>
                    {i < conv.journey.stages.length - 1 && (
                      <ChevronRight size={10} className="text-muted-foreground/40 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky next-action banner */}
            <div className={`px-6 py-2 border-b flex items-center justify-between gap-3 flex-shrink-0 ${
              conv.status === "urgent" ? "bg-red-400/5 border-red-400/15" : "bg-blue-500/5 border-blue-500/10"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <ArrowRight size={12} className={`flex-shrink-0 ${conv.status === "urgent" ? "text-red-400" : "text-blue-400"}`} />
                <p className={`text-xs font-medium truncate ${conv.status === "urgent" ? "text-red-400" : "text-blue-400"}`}>
                  {conv.journey.nextAction}
                </p>
              </div>
              {conv.journey.blocker && (
                <span className="text-amber-400 text-[10px] font-semibold flex items-center gap-1 flex-shrink-0">
                  <AlertTriangle size={10} /> Blocker
                </span>
              )}
            </div>

            {/* Scrollable content — messages then journey info flows below */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {/* ── MESSAGE THREAD ──────────────────────────────────────── */}
              <div className="px-6 py-5 space-y-3">
                {allMessages.map(msg => {
                  if (msg.from === "system") {
                    return (
                      <div key={msg.id} className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <p className="text-muted-foreground text-xs text-center px-2 flex-shrink-0">{msg.text}</p>
                        <p className="text-muted-foreground text-[10px] flex-shrink-0">{msg.time}</p>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${msg.from === "customer" ? "justify-start" : "justify-end"}`}>
                      {msg.from === "customer" && (
                        <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User size={12} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.from === "ai"
                          ? "bg-violet-400/10 border border-violet-400/15 text-foreground rounded-tr-sm"
                          : "bg-card border border-border text-foreground rounded-tl-sm"
                      }`}>
                        <p className="text-[10px] font-semibold mb-1" style={{ color: msg.from === "ai" ? "#A78BFA" : "#7F8998" }}>
                          {msg.from === "ai" ? "AI Receptionist" : conv.name} · {msg.time}
                        </p>
                        {msg.text}
                      </div>
                      {msg.from === "ai" && (
                        <div className="w-7 h-7 rounded-full bg-violet-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={12} className="text-violet-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="mx-6 h-px bg-border" />

              {/* ── WHERE THIS IS UP TO ──────────────────────────────────── */}
              <div className="px-6 py-6 space-y-5">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-3">Where this is up to</p>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${stageColor(conv.journey.currentStage)}`}>
                      {conv.journey.currentStage}
                    </span>
                    {conv.journey.paymentStatus && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${paymentLabel(conv.journey.paymentStatus).cls}`}>
                        {paymentLabel(conv.journey.paymentStatus).text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2 mb-3">
                    <ArrowRight size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground text-sm font-medium leading-relaxed">{conv.journey.nextAction}</p>
                  </div>
                  {conv.journey.blocker && (
                    <div className="flex items-start gap-2.5 bg-amber-400/6 border border-amber-400/15 rounded-xl px-4 py-3">
                      <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-400 text-sm leading-relaxed">{conv.journey.blocker}</p>
                    </div>
                  )}
                  {conv.journey.paymentNote && (
                    <div className="mt-3 bg-violet-400/5 border border-violet-400/15 rounded-xl px-4 py-3">
                      <p className="text-violet-400 text-xs font-semibold mb-1">Payment</p>
                      <p className="text-foreground text-sm">{conv.journey.paymentNote}</p>
                    </div>
                  )}
                </div>

                {/* Linked records */}
                {conv.journey.linkedRecords.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">Linked records</p>
                    <div className="grid grid-cols-2 gap-2">
                      {conv.journey.linkedRecords.map((rec, i) => (
                        <button
                          key={i}
                          className="text-left px-4 py-3 bg-card border border-border rounded-xl hover:border-border/60 transition-colors flex items-center gap-3"
                          onClick={() => { if (rec.id) onSelect(rec.id); onNavigate(rec.screen); }}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${rec.type === "quote" ? "text-amber-400 bg-amber-400/10" : rec.type === "job" ? "text-blue-400 bg-blue-400/10" : "text-slate-400 bg-slate-400/10"}`}>
                            {rec.type === "quote" ? <FileText size={13} /> : rec.type === "job" ? <Briefcase size={13} /> : <User size={13} />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-xs font-medium leading-snug">{rec.label}</p>
                            <p className="text-muted-foreground text-[10px] capitalize mt-0.5">{rec.type}</p>
                          </div>
                          <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment quick actions */}
                {conv.journey.paymentStatus === "ready-to-invoice" && (
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">Invoice actions</p>
                    <div className="flex gap-2 flex-wrap">
                      <Btn size="sm" variant="primary"><FileText size={12} /> Create invoice draft</Btn>
                      <Btn size="sm" variant="secondary"><Check size={12} /> Mark invoice as sent</Btn>
                    </div>
                  </div>
                )}
                {conv.journey.paymentStatus === "invoice-sent" && (
                  <div className="flex gap-2">
                    <Btn size="sm" variant="primary"><Check size={12} /> Mark as paid</Btn>
                    <Btn size="sm" variant="secondary"><Send size={12} /> Send reminder</Btn>
                  </div>
                )}
                {conv.journey.paymentStatus === "overdue" && (
                  <div className="flex gap-2">
                    <Btn size="sm" variant="danger"><Send size={12} /> Send overdue reminder</Btn>
                    <Btn size="sm" variant="secondary"><Phone size={12} /> Call about payment</Btn>
                  </div>
                )}

                {/* AI context */}
                <div className="bg-violet-400/5 border border-violet-400/15 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={13} className="text-violet-400" />
                    <span className="text-violet-400 text-xs font-semibold">AI context</span>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">{conv.aiSummary}</p>
                </div>

                {/* Suggested actions */}
                {conv.suggestedActions.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">Suggested actions</p>
                    <div className="space-y-2">
                      {conv.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                            i === 0 && conv.status === "urgent"
                              ? "bg-red-400/10 border-red-400/20 text-red-400 hover:bg-red-400/15"
                              : i === 0
                              ? "bg-blue-500/10 border-blue-500/15 text-blue-400 hover:bg-blue-500/15"
                              : "bg-card border-border text-foreground hover:bg-muted"
                          }`}
                          onClick={() => {
                            if (action.toLowerCase().includes("quote")) onNavigate("quote-builder");
                            else if (action.toLowerCase().includes("job")) onNavigate("jobs");
                          }}
                        >
                          <span>{action}</span>
                          <ArrowRight size={13} className="flex-shrink-0 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mark done */}
                {conv.status !== "done" && (
                  <div className="pt-3 border-t border-border">
                    <Btn variant="ghost" full><Check size={14} /> Mark conversation done</Btn>
                  </div>
                )}

                <div className="h-4" />
              </div>
            </div>

            {/* ── REPLY BAR — sticky at bottom ──────────────────────────── */}
            <div className="border-t border-border flex-shrink-0 bg-background">
              {conv.status !== "done" && conv.status !== "ai-handled" && (
                <div className="px-6 pt-3 pb-2">
                  <div className="bg-violet-400/5 border border-violet-400/15 rounded-xl px-4 py-2.5 flex items-start gap-2.5">
                    <Bot size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-[10px] font-semibold mb-0.5">AI suggested reply — review before sending</p>
                      <p className="text-foreground text-xs leading-relaxed line-clamp-2">
                        {conv.status === "quote-reply"
                          ? `Hi ${conv.name.split(" ")[0]}! The price on the quote is still the same — we'll confirm the final amount after the inspection. Happy to lock in a date whenever suits you.`
                          : conv.status === "urgent"
                          ? `Hi ${conv.name.split(" ")[0]}, Ryan is on his way and will be with you within the hour. Please keep the water off at the mains until he arrives.`
                          : `Hi ${conv.name.split(" ")[0]}, thanks for getting in touch. Ryan will be in touch shortly.`}
                      </p>
                    </div>
                    <button
                      className="text-violet-400 text-[11px] font-semibold hover:text-violet-300 transition-colors flex-shrink-0"
                      onClick={() => setMsgPreview({
                        recipient: conv.name,
                        channel: conv.channel === "email" ? "email" : "sms",
                        message: conv.status === "quote-reply"
                          ? `Hi ${conv.name.split(" ")[0]}! The price on the quote is still the same — we'll confirm the final amount after the inspection. Happy to lock in a date whenever suits you.`
                          : conv.status === "urgent"
                          ? `Hi ${conv.name.split(" ")[0]}, Ryan is on his way and will be with you within the hour. Please keep the water off at the mains until he arrives.`
                          : `Hi ${conv.name.split(" ")[0]}, thanks for getting in touch. Ryan will be in touch shortly.`,
                      })}
                    >Review & send →</button>
                  </div>
                </div>
              )}
              <div className="px-6 py-3">
                <div className="flex items-end gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-blue-500/40 transition-colors">
                  <textarea
                    className="flex-1 bg-transparent text-foreground text-sm resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed"
                    rows={2}
                    placeholder="Type a reply… tap Send to preview before it goes."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) setMsgPreview({ recipient: conv.name, channel: conv.channel === "email" ? "email" : "sms", message: replyText.trim() }); } }}
                  />
                  <button
                    className="w-8 h-8 rounded-xl bg-blue-500 hover:bg-blue-400 flex items-center justify-center flex-shrink-0 transition-colors"
                    onClick={() => {
                      if (replyText.trim()) {
                        setMsgPreview({ recipient: conv.name, channel: conv.channel === "email" ? "email" : "sms", message: replyText.trim() });
                      }
                    }}
                  >
                    <Send size={13} className="text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-1.5">
                  <button
                    className="text-muted-foreground text-xs hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => onNavigate("quote-builder")}
                  >
                    <FileText size={11} /> Attach quote
                  </button>
                  <button
                    className="text-muted-foreground text-xs hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => onNavigate("jobs")}
                  >
                    <Briefcase size={11} /> Attach job
                  </button>
                  <button className="text-muted-foreground text-xs hover:text-foreground transition-colors flex items-center gap-1">
                    <Bot size={11} /> Ask AI to draft
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── QUOTE BUILDER ────────────────────────────────────────────────────────────

function QuoteBuilderScreen({
  onBack, onNavigate, prefillCustomerId,
}: {
  onBack: () => void; onNavigate: (s: Screen, id?: string) => void; prefillCustomerId?: string;
}) {
  const [customerId, setCustomerId] = useState(prefillCustomerId || "");
  const [jobType, setJobType] = useState("");
  const [address, setAddress] = useState("");
  const [dateNeeded, setDateNeeded] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment due within 14 days of invoice date. All work is guaranteed for 12 months from date of completion.");
  const [discount, setDiscount] = useState(0);
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [sent, setSent] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { id: "li1", category: "labour", desc: "Labour", qty: 1, rate: 0 },
    { id: "li2", category: "materials", desc: "Materials", qty: 1, rate: 0 },
    { id: "li3", category: "travel", desc: "Travel / callout fee", qty: 1, rate: 0 },
  ]);

  const customer = CUSTOMERS.find(c => c.id === customerId);
  const aiSuggestion = AI_PRICE_SUGGESTIONS[jobType] ?? null;

  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.rate, 0);
  const discountAmt = Math.round((subtotal * discount) / 100);
  const afterDiscount = subtotal - discountAmt;
  const gst = Math.round(afterDiscount * 0.1);
  const total = afterDiscount + gst;

  const addLineItem = (cat: QuoteLineItem["category"]) => {
    setLineItems(prev => [...prev, {
      id: `li-${Date.now()}`, category: cat,
      desc: cat === "labour" ? "Additional labour" : cat === "materials" ? "Materials" : cat === "travel" ? "Travel" : "Optional extra",
      qty: 1, rate: 0,
    }]);
  };

  const updateLineItem = (id: string, field: keyof QuoteLineItem, value: string | number) => {
    setLineItems(prev => prev.map(li => li.id === id ? { ...li, [field]: value } : li));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(li => li.id !== id));
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    const mid = Math.round((aiSuggestion.range[0] + aiSuggestion.range[1]) / 2);
    const labour = Math.round(mid * 0.65);
    const materials = Math.round(mid * 0.25);
    const travel = Math.round(mid * 0.1);
    setLineItems([
      { id: "li1", category: "labour", desc: "Labour", qty: 1, rate: labour },
      { id: "li2", category: "materials", desc: "Materials", qty: 1, rate: materials },
      { id: "li3", category: "travel", desc: "Travel / callout fee", qty: 1, rate: travel },
    ]);
  };

  const catColors: Record<string, string> = {
    labour: "text-blue-400",
    materials: "text-emerald-400",
    travel: "text-amber-400",
    extra: "text-violet-400",
  };

  const catLabels: Record<string, string> = {
    labour: "Labour",
    materials: "Materials",
    travel: "Travel",
    extra: "Extra",
  };

  const quoteNum = "Q-1088";

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground mb-2 transition-colors" onClick={onBack}>
            <ChevronLeft size={16} /> Back to quotes
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-2xl font-bold">New quote</h1>
            <span className="text-blue-400 text-sm font-semibold border border-blue-500/20 bg-blue-500/8 px-2 py-0.5 rounded-lg">{quoteNum}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Build a quote and send it to your customer in minutes.</p>
        </div>
        <div className="flex gap-2">
          {!savedDraft && !sent && (
            <Btn variant="secondary" onClick={() => setSavedDraft(true)}>
              <Clipboard size={14} /> Save draft
            </Btn>
          )}
          {savedDraft && !sent && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
              <Check size={14} /> Draft saved
            </span>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground text-sm font-semibold hover:bg-accent transition-colors"
            onClick={() => setShowPreview(v => !v)}
          >
            <Eye size={14} /> {showPreview ? "Hide" : "Preview"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* ── LEFT: Builder form ─────────────────────────────────────────── */}
        <div className="col-span-3 space-y-5">

          {/* Customer & job details */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold text-sm mb-4">Customer & job details</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Customer */}
              <div className="col-span-2">
                <label className="text-foreground text-xs font-medium block mb-1.5">Customer</label>
                <div className="relative">
                  <select
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                    value={customerId}
                    onChange={e => {
                      setCustomerId(e.target.value);
                      const c = CUSTOMERS.find(x => x.id === e.target.value);
                      if (c) setAddress(c.suburb);
                    }}
                  >
                    <option value="">Select customer…</option>
                    {CUSTOMERS.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.suburb}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {customer && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/15 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-[10px] font-bold">{customer.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-foreground text-xs font-medium">{customer.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">{customer.phone}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{customer.type}</span>
                  </div>
                )}
              </div>

              {/* Job type */}
              <div>
                <label className="text-foreground text-xs font-medium block mb-1.5">Job type</label>
                <div className="relative">
                  <select
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                    value={jobType}
                    onChange={e => setJobType(e.target.value)}
                  >
                    <option value="">Select job type…</option>
                    {Object.keys(AI_PRICE_SUGGESTIONS).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Other">Other / custom</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Date needed */}
              <div>
                <label className="text-foreground text-xs font-medium block mb-1.5">Date needed</label>
                <input
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                  placeholder="e.g. This week, 28 June"
                  value={dateNeeded}
                  onChange={e => setDateNeeded(e.target.value)}
                />
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className="text-foreground text-xs font-medium block mb-1.5">Address / suburb</label>
                <input
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                  placeholder="e.g. 7 Riverbank Dr, Albury NSW 2640"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-semibold text-sm">Line items</h3>
              {aiSuggestion && (
                <button
                  className="text-violet-400 text-xs font-semibold hover:text-violet-300 transition-colors flex items-center gap-1"
                  onClick={applyAISuggestion}
                >
                  <Bot size={11} /> Apply AI pricing
                </button>
              )}
            </div>

            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 px-3 pb-2 text-[11px] text-muted-foreground font-medium">
              <span className="col-span-1">Type</span>
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Rate ($)</span>
              <span className="col-span-1 text-right">Total</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-1.5">
              {lineItems.map(li => (
                <div key={li.id} className="grid grid-cols-12 gap-2 items-center bg-secondary rounded-xl px-3 py-2">
                  <div className="col-span-1">
                    <span className={`text-[10px] font-semibold ${catColors[li.category]}`}>
                      {catLabels[li.category]}
                    </span>
                  </div>
                  <div className="col-span-5">
                    <input
                      className="w-full bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
                      value={li.desc}
                      onChange={e => updateLineItem(li.id, "desc", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="w-full bg-transparent text-foreground text-sm text-right focus:outline-none"
                      type="number"
                      value={li.qty}
                      min={1}
                      onChange={e => updateLineItem(li.id, "qty", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="w-full bg-transparent text-foreground text-sm text-right focus:outline-none"
                      type="number"
                      value={li.rate || ""}
                      placeholder="0"
                      onChange={e => updateLineItem(li.id, "rate", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-foreground text-sm font-medium">${(li.qty * li.rate).toLocaleString()}</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button className="text-muted-foreground hover:text-red-400 transition-colors" onClick={() => removeLineItem(li.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add line item */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-muted-foreground text-xs">Add:</span>
              {(["labour", "materials", "travel", "extra"] as const).map(cat => (
                <button
                  key={cat}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors hover:opacity-80 ${catColors[cat]} bg-current/10 border-current/20`}
                  style={{ color: cat === "labour" ? "#60a5fa" : cat === "materials" ? "#34d399" : cat === "travel" ? "#fbbf24" : "#a78bfa" }}
                  onClick={() => addLineItem(cat)}
                >
                  + {catLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Totals + discount */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold text-sm mb-4">Totals</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-medium">${subtotal.toLocaleString()}</span>
              </div>
              {/* Discount row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Discount</span>
                  <div className="relative">
                    <input
                      className="w-16 bg-secondary border border-border rounded-lg px-2.5 py-1 text-foreground text-sm text-right focus:outline-none focus:border-blue-500/40"
                      type="number"
                      value={discount}
                      min={0}
                      max={100}
                      onChange={e => setDiscount(Number(e.target.value))}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                  </div>
                </div>
                <span className={`text-sm ${discountAmt > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {discountAmt > 0 ? `-$${discountAmt.toLocaleString()}` : "$0"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST (10%)</span>
                <span className="text-foreground">${gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="text-foreground font-bold text-base">Total</span>
                <span className="text-foreground font-bold text-xl">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Deposit */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-foreground text-sm font-medium">Deposit required</p>
                  <p className="text-muted-foreground text-xs">Request a deposit before work starts</p>
                </div>
                <button
                  className={`relative w-10 h-6 rounded-full transition-colors ${depositRequired ? "bg-blue-500" : "bg-muted"}`}
                  onClick={() => setDepositRequired(v => !v)}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${depositRequired ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              {depositRequired && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    className="w-28 bg-secondary border border-border rounded-xl px-3 py-1.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                    type="number"
                    value={depositAmount}
                    placeholder="e.g. 200"
                    onChange={e => setDepositAmount(Number(e.target.value))}
                  />
                  <span className="text-muted-foreground text-xs">required to confirm booking</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & notes */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold text-sm mb-4">Terms & notes</h3>
            <div className="space-y-3">
              <div>
                <label className="text-foreground text-xs font-medium block mb-1.5">Terms</label>
                <textarea
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm resize-none focus:outline-none focus:border-blue-500/40"
                  rows={3}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                />
              </div>
              <div>
                <label className="text-foreground text-xs font-medium block mb-1.5">Internal notes <span className="text-muted-foreground font-normal">(not shown to customer)</span></label>
                <textarea
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm resize-none focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                  rows={2}
                  placeholder="Add any internal notes about this quote…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI suggestions + send ──────────────────────────────── */}
        <div className="col-span-2 space-y-5">

          {/* AI pricing suggestion */}
          {aiSuggestion ? (
            <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={14} className="text-violet-400" />
                <span className="text-violet-400 text-sm font-semibold">AI pricing</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${confidenceStyle(aiSuggestion.confidence).cls}`}>
                  {aiSuggestion.confidence}%
                </span>
              </div>
              <div className="mb-3">
                <p className="text-muted-foreground text-xs mb-1">Suggested range</p>
                <p className="text-foreground text-2xl font-bold">{fmtRange(aiSuggestion.range)}</p>
                <p className="text-muted-foreground text-xs mt-1">Based on {aiSuggestion.jobs.length} similar jobs</p>
              </div>
              <Btn variant="secondary" size="sm" full onClick={applyAISuggestion}>
                <Bot size={12} /> Apply AI pricing
              </Btn>

              {/* Similar past jobs */}
              <div className="mt-4 pt-4 border-t border-violet-400/15">
                <p className="text-muted-foreground text-xs font-semibold mb-2.5">Similar past jobs</p>
                <div className="space-y-2.5">
                  {aiSuggestion.jobs.map((j, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <p className="text-foreground text-xs leading-snug flex-1">{j.desc}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="text-foreground text-xs font-semibold">${j.amount.toLocaleString()}</p>
                        <p className="text-muted-foreground text-[10px]">{j.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className="text-violet-400" />
                <span className="text-violet-400 text-sm font-semibold">AI pricing</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">Select a job type above and AI will suggest a price range based on your past jobs.</p>
            </div>
          )}

          {/* Quote preview */}
          {showPreview && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={14} className="text-muted-foreground" />
                <span className="text-foreground text-sm font-semibold">Quote preview</span>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-foreground font-bold text-sm">Alpine Fresh</p>
                    <p className="text-muted-foreground">Property Maintenance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-bold">{quoteNum}</p>
                    <p className="text-muted-foreground">26 June 2025</p>
                  </div>
                </div>
                {customer && (
                  <div>
                    <p className="text-muted-foreground">Prepared for:</p>
                    <p className="text-foreground font-medium">{customer.name}</p>
                    <p className="text-muted-foreground">{address || customer.suburb}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Job:</p>
                  <p className="text-foreground">{jobType || "—"}</p>
                </div>
                {subtotal > 0 && (
                  <div className="border-t border-border pt-2 space-y-1">
                    {lineItems.filter(li => li.rate > 0).map(li => (
                      <div key={li.id} className="flex justify-between">
                        <span className="text-foreground">{li.desc}</span>
                        <span className="text-foreground">${(li.qty * li.rate).toLocaleString()}</span>
                      </div>
                    ))}
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount ({discount}%)</span>
                        <span>-${discountAmt.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST</span>
                      <span className="text-foreground">${gst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border font-bold text-sm">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">${total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {depositRequired && depositAmount > 0 && (
                  <p className="text-amber-400 text-[11px]">Deposit of ${depositAmount} required to confirm booking.</p>
                )}
                <p className="text-muted-foreground leading-relaxed">{terms}</p>
              </div>
            </div>
          )}

          {/* Send quote */}
          {!sent ? (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-foreground font-semibold text-sm mb-1">Send quote</h3>
              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                {customer
                  ? `Will be sent to ${customer.name} via SMS and email.`
                  : "Select a customer to send the quote."}
              </p>
              <div className="space-y-2">
                <Btn
                  variant="primary"
                  full
                  disabled={!customerId || !jobType || total === 0}
                  onClick={() => setSent(true)}
                >
                  <Send size={14} /> Send by SMS + email
                </Btn>
                <Btn
                  variant="secondary"
                  full
                  disabled={!customerId || !jobType}
                >
                  <MessageSquare size={14} /> Send by SMS only
                </Btn>
                <Btn
                  variant="secondary"
                  full
                  disabled={!customerId || !jobType}
                >
                  <Mail size={14} /> Send by email only
                </Btn>
              </div>
              {(!customerId || !jobType || total === 0) && (
                <p className="text-muted-foreground text-xs mt-3 text-center">
                  Complete customer, job type, and at least one line item to send.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">Quote sent!</span>
              </div>
              <p className="text-foreground text-xs leading-relaxed mb-3">
                {quoteNum} sent to {customer?.name ?? "customer"} via SMS and email. RyanOS will follow up in 48 hours if there's no response.
              </p>
              <div className="space-y-2">
                <Btn variant="secondary" full size="sm" onClick={() => onNavigate("quotes")}>
                  <FileText size={12} /> View in quotes
                </Btn>
                <Btn variant="ghost" full size="sm" onClick={() => { setSent(false); setSavedDraft(false); }}>
                  <Plus size={12} /> Create another quote
                </Btn>
              </div>
            </div>
          )}

          {/* Convert to job */}
          {sent && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-foreground text-sm font-semibold mb-2">When accepted</h3>
              <p className="text-muted-foreground text-xs mb-3 leading-relaxed">Once the customer accepts the quote, convert it to a booked job with one click.</p>
              <Btn variant="secondary" full size="sm" onClick={() => onNavigate("jobs")}>
                <Briefcase size={12} /> Convert to job when accepted
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGE PREVIEW MODAL ───────────────────────────────────────────────────

function MessagePreviewModal({
  open, recipient, channel, defaultMessage, onClose, onSend,
}: {
  open: boolean;
  recipient: string;
  channel: "sms" | "email";
  defaultMessage: string;
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState(defaultMessage);
  useEffect(() => { if (open) setText(defaultMessage); }, [open, defaultMessage]);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${channel === "sms" ? "bg-blue-500/10 text-blue-400" : "bg-violet-400/10 text-violet-400"}`}>
            {channel === "sms" ? <MessageSquare size={15} /> : <Mail size={15} />}
          </span>
          <div className="flex-1">
            <p className="text-foreground text-sm font-semibold">Review before sending</p>
            <p className="text-muted-foreground text-xs">{channel === "sms" ? "SMS" : "Email"} to {recipient}</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Message editor */}
        <div className="px-5 py-4">
          <label className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide block mb-2">
            Message — edit if needed
          </label>
          <textarea
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-500/40 transition-colors"
            rows={5}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <p className="text-muted-foreground text-xs mt-2">
            This message will be sent directly to {recipient.split(" ")[0]}. Review carefully.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <Btn variant="primary" full onClick={() => { onSend(text); onClose(); }}>
            <Send size={14} /> Send {channel === "sms" ? "SMS" : "email"} to {recipient.split(" ")[0]}
          </Btn>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── MOBILE APP ───────────────────────────────────────────────────────────────

function MobileApp() {
  type MobTab = "home" | "inbox" | "jobs" | "quotes" | "ai";
  type MobScreen = MobTab | "job-detail" | "conv-detail" | "quote-detail" | "quote-edit" | "settings";

  const [tab, setTab] = useState<MobTab>("home");
  const [screen, setScreen] = useState<MobScreen>("home");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Set<string>>(new Set());
  const [approvedQuotes, setApprovedQuotes] = useState<Set<string>>(new Set());
  const [jobNotes, setJobNotes] = useState<Record<string, string>>({});
  const [jobMaterials, setJobMaterials] = useState<Record<string, Array<{ id: string; desc: string; cost: number }>>>({});
  const [jobPhotos, setJobPhotos] = useState<Record<string, number>>({});
  const [newMat, setNewMat] = useState<Record<string, { desc: string; cost: string }>>({});
  const [mobileExpandedCard, setMobileExpandedCard] = useState<string | null>(null);
  const [jobPeriod, setJobPeriod] = useState<"today" | "week" | "next">("today");
  const [quoteEditLines, setQuoteEditLines] = useState<Record<string, Array<{ id: string; desc: string; amount: number }>>>({});
  const [quoteSent, setQuoteSent] = useState<Set<string>>(new Set());
  const [draftQuotes, setDraftQuotes] = useState<Set<string>>(new Set());
  const [invoicesSubmitted, setInvoicesSubmitted] = useState<Set<string>>(new Set());
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [newJob, setNewJob] = useState({ customer: "", jobType: "", suburb: "", date: "", time: "", urgency: "Normal", notes: "" });
  const [createdJobs, setCreatedJobs] = useState<Job[]>([]);
  const [etaSent, setEtaSent] = useState<Record<string, string | null>>({});
  const [actionStates, setActionStates] = useState<Record<string, string>>({});
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { from: "ai" as const, text: "Good morning, Ryan. AI handled 23 calls today and booked 6 jobs. You have 4 things needing attention. What would you like to know?" }
  ]);

  const tabs = [
    { id: "home" as const, label: "Today", icon: Home },
    { id: "inbox" as const, label: "Inbox", icon: Inbox },
    { id: "jobs" as const, label: "Jobs", icon: Briefcase },
    { id: "quotes" as const, label: "Quotes", icon: FileText },
    { id: "ai" as const, label: "AI", icon: Bot },
  ];

  const goToJob = (id: string) => { setSelectedJobId(id); setScreen("job-detail"); };
  const goToConv = (id: string) => { setSelectedConvId(id); setScreen("conv-detail"); };
  const goToQuote = (id: string) => { setSelectedQuoteId(id); setScreen("quote-detail"); };
  const goBack = () => { setScreen(tab); };

  const { jobs } = useJobs();
  const { quotes } = useQuotes();
  const job = jobs.find(j => j.id === selectedJobId) ?? JOBS.find(j => j.id === selectedJobId);
  const conv = conversations.find(c => c.id === selectedConvId) ?? INBOX.find(c => c.id === selectedConvId);
  const quote = quotes.find(q => q.id === selectedQuoteId) ?? QUOTES.find(q => q.id === selectedQuoteId);

  const urgentCount = conversations.filter(c => c.status === "urgent" || c.status === "needs-human").length;

  const sendAiMessage = () => {
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { from: "user" as const, text: msg }]);
    setTimeout(() => {
      const lower = msg.toLowerCase();
      let reply = "I can help with that. Try asking about today's jobs, pending quotes, or missed calls.";
      if (lower.includes("job")) reply = "You have 3 jobs today:\n• 8:30 AM — Mick Harris, hot water repair, Wodonga\n• 11:00 AM — Sarah Thompson, chimney sweep, Albury\n• 2:00 PM — Darren Cole, water tank clean, Lavington";
      else if (lower.includes("quote")) reply = "2 quotes need your approval:\n• Q-1087 — Anne McKenzie, roof treatment $799–$1,200\n• Q-1086 — Emma Roberts, split system $180–$350";
      else if (lower.includes("miss") || lower.includes("call")) reply = "1 missed call needs follow-up:\n• 0499 123 456 called at 8:22 AM. They replied saying they need a water tank clean in Corowa.";
      else if (lower.includes("revenue") || lower.includes("money")) reply = "Revenue this week: $8,648 booked. That's up 34% on last week.";
      setAiMessages(prev => [...prev, { from: "ai" as const, text: reply }]);
    }, 700);
  };

  /* ── JOB DETAIL — TECH PORTAL ── */
  if (screen === "job-detail" && job) {
    const isDone = completedJobs.has(job.id);
    const notes = jobNotes[job.id] || "";
    const materials = jobMaterials[job.id] || [];
    const photoCount = jobPhotos[job.id] || 0;
    const matInput = newMat[job.id] || { desc: "", cost: "" };
    const matTotal = materials.reduce((s, m) => s + m.cost, 0);
    const jobEta = etaSent[job.id] ?? null;

    const addMaterial = () => {
      if (!matInput.desc.trim()) return;
      const item = { id: Date.now().toString(), desc: matInput.desc.trim(), cost: Number(matInput.cost) || 0 };
      setJobMaterials(prev => ({ ...prev, [job.id]: [...(prev[job.id] || []), item] }));
      setNewMat(prev => ({ ...prev, [job.id]: { desc: "", cost: "" } }));
    };

    const removeMaterial = (id: string) =>
      setJobMaterials(prev => ({ ...prev, [job.id]: (prev[job.id] || []).filter(m => m.id !== id) }));

    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground active:text-foreground" onClick={goBack}>
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-bold text-base truncate">{job.title}</p>
            <p className="text-muted-foreground text-xs">{job.time} · {job.suburb}</p>
          </div>
          <Badge label={isDone ? "Complete" : job.status} cls={isDone ? "text-emerald-400 bg-emerald-400/10" : statusStyle(job.status)} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-5">

            {/* ── SEND ETA ── */}
            {!jobEta ? (
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-4">
                <p className="text-foreground text-sm font-semibold mb-1">Send ETA to {job.customer.split(" ")[0]}</p>
                <p className="text-muted-foreground text-xs mb-3">
                  Let the customer know you're on your way and when to expect you.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {["15 min", "30 min", "60 min"].map(eta => (
                    <button
                      key={eta}
                      className="py-3 rounded-xl bg-blue-500 text-white text-sm font-bold active:bg-blue-400 transition-colors flex flex-col items-center gap-0.5"
                      onClick={() => setEtaSent(prev => ({ ...prev, [job.id]: eta }))}
                    >
                      <span className="text-base font-extrabold leading-none">{eta.split(" ")[0]}</span>
                      <span className="text-[11px] opacity-80">min ETA</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-emerald-400 text-sm font-semibold">ETA sent ✓</p>
                  <p className="text-foreground text-xs mt-0.5">
                    SMS sent: "Hi {job.customer.split(" ")[0]}, Ryan from Alpine Fresh is on his way — {jobEta} ETA."
                  </p>
                </div>
                <button
                  className="text-muted-foreground text-xs hover:text-foreground transition-colors flex-shrink-0"
                  onClick={() => setEtaSent(prev => ({ ...prev, [job.id]: null }))}
                >
                  Resend
                </button>
              </div>
            )}

            {/* Customer + quick actions */}
            {(() => {
              const linkedConv = conversations.find(c => c.customerId === job.customerId);
              return (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-foreground font-semibold text-base">{job.customer}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{job.address}</p>
                      <p className="text-muted-foreground text-xs">{fmtRange(job.value)} estimate</p>
                    </div>
                    {job.urgency === "Urgent" && (
                      <span className="text-red-400 text-[11px] font-bold bg-red-400/10 px-2 py-1 rounded-full">⚡ Urgent</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button className="py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center gap-1 active:bg-blue-500/20 transition-colors">
                      <Phone size={17} className="text-blue-400" />
                      <span className="text-blue-400 text-[10px] font-semibold">Call</span>
                    </button>
                    <button className="py-3 rounded-xl bg-secondary border border-border flex flex-col items-center gap-1 active:bg-muted transition-colors">
                      <MapPin size={17} className="text-muted-foreground" />
                      <span className="text-muted-foreground text-[10px] font-semibold">Navigate</span>
                    </button>
                    <button className="py-3 rounded-xl bg-secondary border border-border flex flex-col items-center gap-1 active:bg-muted transition-colors">
                      <MessageSquare size={17} className="text-muted-foreground" />
                      <span className="text-muted-foreground text-[10px] font-semibold">SMS</span>
                    </button>
                    <button
                      className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-colors border ${
                        linkedConv
                          ? "bg-violet-400/10 border-violet-400/20 active:bg-violet-400/20"
                          : "bg-secondary border-border opacity-40"
                      }`}
                      onClick={() => { if (linkedConv) { setSelectedConvId(linkedConv.id); setScreen("conv-detail"); } }}
                    >
                      <MessageSquare size={17} className={linkedConv ? "text-violet-400" : "text-muted-foreground"} />
                      <span className={`text-[10px] font-semibold ${linkedConv ? "text-violet-400" : "text-muted-foreground"}`}>
                        Chat
                      </span>
                      {linkedConv?.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {linkedConv.unread}
                        </span>
                      )}
                    </button>
                  </div>
                  {linkedConv && (
                    <div
                      className="mt-3 pt-3 border-t border-border cursor-pointer active:opacity-70"
                      onClick={() => { setSelectedConvId(linkedConv.id); setScreen("conv-detail"); }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stageColor(linkedConv.journey.currentStage)}`}>
                          {linkedConv.journey.currentStage}
                        </span>
                        <span className="text-muted-foreground text-[10px]">· {linkedConv.time}</span>
                        {linkedConv.unread > 0 && (
                          <span className="ml-auto w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                            {linkedConv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground text-xs truncate">{linkedConv.preview}</p>
                      <p className="text-blue-400 text-[11px] font-semibold mt-1">Open conversation →</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* AI job notes */}
            {job.aiNote && (
              <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-4 flex gap-2.5">
                <Bot size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-violet-400 text-[11px] font-semibold mb-1">AI note from booking call</p>
                  <p className="text-foreground text-sm leading-relaxed">{job.aiNote}</p>
                </div>
              </div>
            )}

            {/* ── ON-SITE NOTES ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Edit2 size={14} className="text-blue-400" />
                <p className="text-foreground text-sm font-semibold">On-site notes</p>
                {notes.length > 0 && <span className="ml-auto text-emerald-400 text-[11px] font-medium">Saved</span>}
              </div>
              <div className="p-4">
                <textarea
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                  rows={4}
                  placeholder={"What did you find on site?\nWhat work was done?\nAnything needed for the invoice?"}
                  value={notes}
                  onChange={e => setJobNotes(prev => ({ ...prev, [job.id]: e.target.value }))}
                />
              </div>
            </div>

            {/* ── MATERIALS & PARTS ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Wrench size={14} className="text-amber-400" />
                <p className="text-foreground text-sm font-semibold">Materials & parts</p>
                {matTotal > 0 && (
                  <span className="ml-auto text-foreground text-sm font-bold">${matTotal.toLocaleString()}</span>
                )}
              </div>
              <div className="p-4 space-y-3">
                {/* Existing items */}
                {materials.length > 0 && (
                  <div className="space-y-2">
                    {materials.map(m => (
                      <div key={m.id} className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3.5 py-2.5">
                        <p className="text-foreground text-sm flex-1">{m.desc}</p>
                        <p className="text-foreground text-sm font-semibold flex-shrink-0">
                          {m.cost > 0 ? `$${m.cost.toLocaleString()}` : "—"}
                        </p>
                        <button
                          className="text-muted-foreground hover:text-red-400 transition-colors p-1 flex-shrink-0"
                          onClick={() => removeMaterial(m.id)}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-1 pt-1 border-t border-border">
                      <p className="text-muted-foreground text-xs">Materials total</p>
                      <p className="text-foreground text-sm font-bold">${matTotal.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Add new item */}
                <div className="space-y-2">
                  <input
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                    placeholder="e.g. Pressure relief valve, 3/4 inch"
                    value={matInput.desc}
                    onChange={e => setNewMat(prev => ({ ...prev, [job.id]: { ...matInput, desc: e.target.value } }))}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMaterial(); } }}
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <input
                        className="w-full bg-secondary border border-border rounded-xl pl-7 pr-3.5 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                        placeholder="Cost (optional)"
                        type="number"
                        value={matInput.cost}
                        onChange={e => setNewMat(prev => ({ ...prev, [job.id]: { ...matInput, cost: e.target.value } }))}
                      />
                    </div>
                    <button
                      className="px-4 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold active:bg-blue-400 transition-colors flex-shrink-0"
                      onClick={addMaterial}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {materials.length === 0 && (
                  <p className="text-muted-foreground text-xs text-center py-1">
                    Add any parts, materials, or items you bought for this job. They'll appear on the invoice.
                  </p>
                )}
              </div>
            </div>

            {/* ── PHOTOS ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Upload size={14} className="text-violet-400" />
                <p className="text-foreground text-sm font-semibold">Photos</p>
                {photoCount > 0 && <span className="ml-auto text-muted-foreground text-xs">{photoCount} added</span>}
              </div>
              <div className="p-4">
                {photoCount > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {Array.from({ length: photoCount }).map((_, i) => (
                      <div key={i} className="aspect-square bg-secondary border border-border rounded-xl flex items-center justify-center relative overflow-hidden">
                        <div className="text-center">
                          <Upload size={16} className="text-muted-foreground mx-auto mb-1" />
                          <p className="text-muted-foreground text-[10px]">Photo {i + 1}</p>
                        </div>
                        <button
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center"
                          onClick={() => setJobPhotos(prev => ({ ...prev, [job.id]: Math.max(0, (prev[job.id] || 0) - 1) }))}
                        >
                          <X size={11} className="text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="w-full py-3.5 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 active:bg-muted transition-colors hover:border-blue-500/30 hover:text-blue-400"
                  onClick={() => setJobPhotos(prev => ({ ...prev, [job.id]: (prev[job.id] || 0) + 1 }))}
                >
                  <Upload size={16} />
                  {photoCount === 0 ? "Add photo" : "Add another photo"}
                </button>
                <p className="text-muted-foreground text-[11px] text-center mt-2">
                  Photos are saved with the job and used when creating the invoice.
                </p>
              </div>
            </div>

            {/* ── COMPLETE JOB ── */}
            {!isDone ? (
              <button
                className="w-full py-4 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center gap-3 active:bg-emerald-400/20 transition-colors"
                onClick={() => setCompletedJobs(prev => { const s = new Set(prev); s.add(job.id); return s; })}
              >
                <CheckCircle size={22} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold text-base">Mark job complete</span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Completion summary */}
                <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={18} className="text-emerald-400" />
                    <p className="text-emerald-400 font-bold text-base">Job complete</p>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Job estimate</span>
                      <span className="text-foreground font-medium">{fmtRange(job.value)}</span>
                    </div>
                    {matTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Materials ({materials.length} items)</span>
                        <span className="text-foreground font-medium">${matTotal.toLocaleString()}</span>
                      </div>
                    )}
                    {notes.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Notes</span>
                        <span className="text-emerald-400 text-xs font-medium">Added ✓</span>
                      </div>
                    )}
                    {photoCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Photos</span>
                        <span className="text-emerald-400 text-xs font-medium">{photoCount} added ✓</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ready to invoice */}
                <button
                  className="w-full py-4 rounded-2xl bg-blue-500 flex items-center justify-center gap-3 active:bg-blue-400 transition-colors"
                  onClick={() => {
                    const linkedQuote = quotes.find(q => q.customerId === job.customerId) ?? QUOTES.find(q => q.customerId === job.customerId);
                    if (linkedQuote) { setSelectedQuoteId(linkedQuote.id); setScreen("quote-edit"); }
                    else { setTab("quotes"); setScreen("quotes"); }
                  }}
                >
                  <DollarSign size={20} className="text-white" />
                  <span className="text-white font-bold text-base">Create invoice draft</span>
                </button>

                <button
                  className="w-full py-3 rounded-2xl border border-border text-muted-foreground text-sm font-medium active:bg-muted transition-colors"
                  onClick={() => setCompletedJobs(prev => { const s = new Set(prev); s.delete(job.id); return s; })}
                >
                  Undo — job not complete yet
                </button>
              </div>
            )}

            <div className="h-4" />
          </div>
        </div>
      </div>
    );
  }

  /* ── CONVERSATION DETAIL ── */
  if (screen === "conv-detail" && conv) {
    const chanLabel: Record<string, string> = { sms: "SMS", email: "Email", web: "Web form", handoff: "AI escalation", call: "Call" };
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground" onClick={goBack}><ChevronLeft size={22} /></button>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-bold text-base truncate">{conv.name}</p>
            <p className="text-muted-foreground text-xs">{chanLabel[conv.channel] ?? conv.channel} · {conv.time}</p>
          </div>
          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${stageColor(conv.journey.currentStage)}`}>
            {conv.journey.currentStage}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Next action */}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 flex gap-2.5">
            <ArrowRight size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-foreground text-sm font-medium leading-relaxed">{conv.journey.nextAction}</p>
          </div>
          {/* Blocker */}
          {conv.journey.blocker && (
            <div className="bg-amber-400/6 border border-amber-400/15 rounded-2xl p-4 flex gap-2.5">
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-400 text-sm leading-relaxed">{conv.journey.blocker}</p>
            </div>
          )}
          {/* Messages */}
          <div className="space-y-2.5">
            {conv.messages.map(msg => {
              if (msg.from === "system") return (
                <p key={msg.id} className="text-muted-foreground text-xs text-center py-1">{msg.text}</p>
              );
              return (
                <div key={msg.id} className={`flex ${msg.from === "customer" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.from === "ai" ? "bg-violet-400/10 border border-violet-400/15 text-foreground" : "bg-card border border-border text-foreground"
                  }`}>
                    <p className="text-[10px] font-semibold mb-0.5" style={{ color: msg.from === "ai" ? "#A78BFA" : "#7F8998" }}>
                      {msg.from === "ai" ? "AI" : conv.name} · {msg.time}
                    </p>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {conv.status === "urgent" ? (
              <button className="col-span-2 py-4 rounded-2xl bg-red-400/10 border border-red-400/25 flex items-center justify-center gap-2 active:bg-red-400/20 transition-colors">
                <Phone size={20} className="text-red-400" />
                <span className="text-red-400 font-bold text-base">Call now — urgent</span>
              </button>
            ) : (
              <button className="py-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center gap-2 active:bg-blue-500/20">
                <Phone size={18} className="text-blue-400" />
                <span className="text-blue-400 font-semibold text-sm">Call</span>
              </button>
            )}
            <button className="py-3.5 rounded-2xl bg-secondary border border-border flex items-center justify-center gap-2 active:bg-muted">
              <MessageSquare size={18} className="text-muted-foreground" />
              <span className="text-muted-foreground font-semibold text-sm">Reply</span>
            </button>
            {conv.linkedQuoteId && (
              <button className="py-3.5 rounded-2xl bg-amber-400/8 border border-amber-400/15 flex items-center justify-center gap-2 active:bg-amber-400/15"
                onClick={() => goToQuote(conv.linkedQuoteId!)}>
                <FileText size={18} className="text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">View quote</span>
              </button>
            )}
            {conv.linkedJobId && (
              <button className="py-3.5 rounded-2xl bg-blue-500/8 border border-blue-500/15 flex items-center justify-center gap-2 active:bg-blue-500/15"
                onClick={() => goToJob(conv.linkedJobId!)}>
                <Briefcase size={18} className="text-blue-400" />
                <span className="text-blue-400 font-semibold text-sm">View job</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── QUOTE DETAIL ── */
  if (screen === "quote-detail" && quote) {
    const isApproved = approvedQuotes.has(quote.id);
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground" onClick={goBack}><ChevronLeft size={22} /></button>
          <div className="flex-1 min-w-0">
            <p className="text-blue-400 text-xs font-semibold">{quote.num}</p>
            <p className="text-foreground font-bold text-base truncate">{quote.customer}</p>
          </div>
          <Badge label={isApproved ? "Sent ✓" : quote.status} cls={isApproved ? "text-emerald-400 bg-emerald-400/10" : statusStyle(quote.status)} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-muted-foreground text-xs mb-1">{quote.jobType}</p>
            <p className="text-foreground text-3xl font-bold">{fmtRange(quote.amount)}</p>
            <p className="text-muted-foreground text-xs mt-1">{quote.created}</p>
          </div>
          {quote.aiReason && (
            <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-4 flex gap-2.5">
              <Bot size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-foreground text-sm leading-relaxed">{quote.aiReason.split(".")[0]}.</p>
            </div>
          )}
          {!isApproved && (quote.status === "Needs approval" || quote.status === "Follow-up due") ? (
            <div className="space-y-3">
              <button
                className="w-full py-4 rounded-2xl bg-blue-500 flex items-center justify-center gap-2 active:bg-blue-400 transition-colors"
                onClick={() => setApprovedQuotes(prev => new Set([...prev, quote.id]))}
              >
                <Check size={20} className="text-white" />
                <span className="text-white font-bold text-base">
                  {quote.status === "Follow-up due" ? "Send follow-up" : "Approve & send to customer"}
                </span>
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="py-3.5 rounded-2xl bg-secondary border border-border flex items-center justify-center gap-2 active:bg-muted">
                  <Phone size={18} className="text-muted-foreground" />
                  <span className="text-muted-foreground text-sm font-semibold">Call first</span>
                </button>
                <button
                  className="py-3.5 rounded-2xl bg-secondary border border-border flex items-center justify-center gap-2 active:bg-muted"
                  onClick={() => setScreen("quote-edit")}
                >
                  <Edit2 size={18} className="text-muted-foreground" />
                  <span className="text-muted-foreground text-sm font-semibold">Edit price</span>
                </button>
              </div>
            </div>
          ) : isApproved ? (
            <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-semibold text-sm">Sent to {quote.customer}</p>
                <p className="text-muted-foreground text-xs mt-0.5">RyanOS will follow up in 48 hours if no reply.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3.5 rounded-2xl bg-secondary border border-border flex items-center justify-center gap-2 active:bg-muted">
                <Phone size={18} className="text-muted-foreground" />
                <span className="text-muted-foreground text-sm font-semibold">Call</span>
              </button>
              <button className="py-3.5 rounded-2xl bg-secondary border border-border flex items-center justify-center gap-2 active:bg-muted">
                <MessageSquare size={18} className="text-muted-foreground" />
                <span className="text-muted-foreground text-sm font-semibold">SMS</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── SETTINGS ── */
  if (screen === "settings") {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground active:text-foreground" onClick={goBack}>
            <ChevronLeft size={22} />
          </button>
          <p className="text-foreground font-bold text-base flex-1">Settings</p>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[11px] font-medium">AI Online</span>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Business */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-foreground text-sm font-semibold">Business</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: "Business name", value: "Alpine Fresh Property Maintenance" },
                { label: "Phone number", value: "02 6041 1234" },
                { label: "Email", value: "info@alpinefresh.com.au" },
                { label: "Owner", value: "Ryan Thomas" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3.5">
                  <p className="text-muted-foreground text-sm">{label}</p>
                  <p className="text-foreground text-sm font-medium text-right">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI & calls */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-foreground text-sm font-semibold">AI receptionist</p>
            </div>
            <div className="px-4 divide-y divide-border">
              {([
                { label: "AI answers calls", state: true, key: "ai" },
                { label: "AI books jobs automatically", state: true, key: "book" },
                { label: "AI gives price ranges", state: true, key: "price" },
                { label: "After-hours answering", state: true, key: "after" },
              ] as const).map(({ label }) => (
                <div key={label} className="flex items-center justify-between py-3.5">
                  <p className="text-foreground text-sm">{label}</p>
                  <span className="text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full">On</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-foreground text-sm font-semibold">Alerts & notifications</p>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-muted-foreground text-sm">SMS alerts to</p>
                <p className="text-foreground text-sm font-medium">0412 987 654</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-muted-foreground text-sm">Emergency mode</p>
                <p className="text-foreground text-sm font-medium">SMS + call</p>
              </div>
            </div>
          </div>

          {/* Active services */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-foreground text-sm font-semibold">Active services</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "Chimney sweep", range: "$299–$499" },
                { name: "Water tank clean", range: "$399–$999" },
                { name: "Gutter clean", range: "$250–$650" },
                { name: "Roof moss treatment", range: "$799–$1,799" },
                { name: "Emergency callout", range: "+$180 surcharge" },
              ].map(({ name, range }) => (
                <div key={name} className="flex items-center justify-between px-4 py-3">
                  <p className="text-foreground text-sm">{name}</p>
                  <p className="text-muted-foreground text-xs">{range}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Full settings note */}
          <div className="bg-secondary border border-border rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={15} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Full settings — including pricing rules, AI behaviour, calendar availability, and email — are available on the desktop version of RyanOS.
            </p>
          </div>

          <div className="h-4" />
        </div>
      </div>
    );
  }

  /* ── QUOTE EDIT ── */
  if (screen === "quote-edit" && quote) {
    // Find linked job by customerId
    const linkedJob = jobs.find(j => j.customerId === quote.customerId) ?? JOBS.find(j => j.customerId === quote.customerId);
    const techNotes = linkedJob ? (jobNotes[linkedJob.id] || "") : "";
    const siteMaterials = linkedJob ? (jobMaterials[linkedJob.id] || []) : [];
    const sitePhotoCount = linkedJob ? (jobPhotos[linkedJob.id] || 0) : 0;
    const customer = CUSTOMERS.find(c => c.id === quote.customerId);

    // Initialise edit lines from quote + site materials if not already set
    const existingLines = quoteEditLines[quote.id];
    if (!existingLines) {
      const midPrice = Math.round((quote.amount[0] + quote.amount[1]) / 2);
      const labour = Math.round(midPrice * 0.7);
      const callout = 180;
      const initial = [
        { id: "l1", desc: "Labour", amount: labour },
        { id: "l2", desc: "Callout / service fee", amount: callout },
        ...siteMaterials.map(m => ({ id: m.id, desc: m.desc, amount: m.cost })),
      ];
      // Don't set state in render — use initial as fallback
      setTimeout(() => setQuoteEditLines(prev => ({ ...prev, [quote.id]: initial })), 0);
    }
    const lines = existingLines || [
      { id: "l1", desc: "Labour", amount: Math.round((quote.amount[0] + quote.amount[1]) / 2 * 0.7) },
      { id: "l2", desc: "Callout / service fee", amount: 180 },
      ...siteMaterials.map(m => ({ id: m.id, desc: m.desc, amount: m.cost })),
    ];

    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const gst = Math.round(subtotal * 0.1);
    const total = subtotal + gst;

    const updateLine = (id: string, field: "desc" | "amount", val: string) => {
      setQuoteEditLines(prev => ({
        ...prev,
        [quote.id]: (prev[quote.id] || lines).map(l =>
          l.id === id ? { ...l, [field]: field === "amount" ? Number(val) || 0 : val } : l
        ),
      }));
    };

    const addLine = () => {
      setQuoteEditLines(prev => ({
        ...prev,
        [quote.id]: [...(prev[quote.id] || lines), { id: Date.now().toString(), desc: "", amount: 0 }],
      }));
    };

    const removeLine = (id: string) => {
      setQuoteEditLines(prev => ({
        ...prev,
        [quote.id]: (prev[quote.id] || lines).filter(l => l.id !== id),
      }));
    };

    const isSent = quoteSent.has(quote.id);
    const isDraft = draftQuotes.has(quote.id);
    const isSubmitted = invoicesSubmitted.has(quote.id);

    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground active:text-foreground"
            onClick={() => { setScreen("quotes"); setTab("quotes"); }}>
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-blue-400 text-xs font-semibold">{quote.num} · {quote.customer}</p>
            <p className="text-foreground font-bold text-base truncate">{quote.jobType}</p>
          </div>
          {isSent && <span className="text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2.5 py-1 rounded-full">Sent ✓</span>}
          {isDraft && !isSent && <span className="text-blue-400 text-xs font-semibold bg-blue-400/10 px-2.5 py-1 rounded-full">Draft</span>}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Customer + job */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide mb-2">Bill to</p>
              <p className="text-foreground font-bold text-base">{quote.customer}</p>
              <p className="text-muted-foreground text-sm">{quote.jobType}</p>
              {customer && <p className="text-muted-foreground text-xs mt-0.5">{customer.phone} · {customer.suburb}</p>}
            </div>

            {/* Tech notes from job */}
            {techNotes.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Edit2 size={13} className="text-blue-400" />
                  <p className="text-foreground text-sm font-semibold">On-site notes</p>
                  <span className="text-muted-foreground text-[10px] ml-auto">from job</span>
                </div>
                <p className="text-foreground text-sm leading-relaxed">{techNotes}</p>
              </div>
            )}

            {/* Site materials */}
            {siteMaterials.length > 0 && (
              <div className="bg-amber-400/5 border border-amber-400/15 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench size={13} className="text-amber-400" />
                  <p className="text-foreground text-sm font-semibold">Materials from site</p>
                  <span className="text-amber-400 text-xs font-semibold ml-auto">${siteMaterials.reduce((s, m) => s + m.cost, 0).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  {siteMaterials.map(m => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span className="text-foreground">{m.desc}</span>
                      <span className="text-muted-foreground">{m.cost > 0 ? `$${m.cost}` : "—"}</span>
                    </div>
                  ))}
                </div>
                <p className="text-amber-400 text-[11px] mt-2">These have been added to the invoice lines below.</p>
              </div>
            )}

            {/* Photos */}
            {sitePhotoCount > 0 && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-card border border-border rounded-xl">
                <Upload size={14} className="text-violet-400" />
                <p className="text-foreground text-sm">{sitePhotoCount} photo{sitePhotoCount !== 1 ? "s" : ""} attached from site</p>
                <span className="ml-auto text-emerald-400 text-xs font-semibold">Included ✓</span>
              </div>
            )}

            {/* Editable line items */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-foreground text-sm font-semibold">Invoice lines</p>
                <button
                  className="text-blue-400 text-xs font-semibold active:text-blue-300"
                  onClick={addLine}
                >
                  + Add line
                </button>
              </div>
              <div className="divide-y divide-border">
                {lines.map((line, i) => (
                  <div key={line.id} className="px-4 py-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        className="w-full bg-transparent text-foreground text-sm font-medium focus:outline-none placeholder:text-muted-foreground"
                        value={line.desc}
                        placeholder={`Item ${i + 1}`}
                        onChange={e => updateLine(line.id, "desc", e.target.value)}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-xs">$</span>
                        <input
                          className="bg-secondary border border-border rounded-lg px-2 py-1 text-foreground text-sm w-24 focus:outline-none focus:border-blue-500/40"
                          type="number"
                          value={line.amount || ""}
                          placeholder="0"
                          onChange={e => updateLine(line.id, "amount", e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      className="p-2 text-muted-foreground active:text-red-400 flex-shrink-0"
                      onClick={() => removeLine(line.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-4 py-4 bg-secondary border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (10%)</span>
                  <span className="text-foreground">${gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Send / Draft / Sent */}
            {/* Submit / Submitted state */}
            {isSubmitted ? (
              <div className="space-y-3">
                <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-400 font-bold text-base">Submitted for owner review</p>
                  </div>
                  <div className="space-y-1 pl-8 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice total</span>
                      <span className="text-foreground font-semibold">${total.toLocaleString()} incl. GST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="text-foreground">{quote.customer}</span>
                    </div>
                    {lines.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Line items</span>
                        <span className="text-foreground">{lines.length} items</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-blue-500/6 border border-blue-500/15 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                  <AlertCircle size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-foreground text-xs leading-relaxed">
                    The owner will review this invoice, add anything extra if needed, and send it to {quote.customer.split(" ")[0]}. You're done — good work.
                  </p>
                </div>
                <button
                  className="w-full py-3 rounded-2xl border border-border text-muted-foreground text-sm font-medium active:bg-muted transition-colors"
                  onClick={() => setInvoicesSubmitted(prev => { const s = new Set(prev); s.delete(quote.id); return s; })}
                >
                  Edit invoice
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Total summary */}
                <div className="bg-secondary border border-border rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-muted-foreground text-xs">Invoice total</p>
                      <p className="text-foreground font-extrabold text-2xl leading-none mt-0.5">${total.toLocaleString()}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">incl. GST · {lines.length} line item{lines.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">For</p>
                      <p className="text-foreground text-sm font-semibold">{quote.customer.split(" ")[0]}</p>
                      <p className="text-muted-foreground text-xs">{CUSTOMERS.find(c => c.id === quote.customerId)?.phone}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      The owner will review this before it goes to the customer. They can add more items or adjust the price.
                    </p>
                  </div>
                </div>

                {/* Primary: Submit for owner review */}
                <button
                  className="w-full py-4 rounded-2xl bg-blue-500 flex items-center justify-center gap-3 active:bg-blue-400 transition-colors"
                  onClick={() => {
                    setInvoicesSubmitted(prev => new Set([...prev, quote.id]));
                    setDraftQuotes(prev => { const s = new Set(prev); s.delete(quote.id); return s; });
                  }}
                >
                  <CheckCircle size={20} className="text-white" />
                  <span className="text-white font-bold text-base">Submit for owner review</span>
                </button>

                {/* Secondary: Save draft */}
                <button
                  className={`w-full py-3.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-colors ${
                    isDraft ? "bg-blue-400/10 border-blue-400/20 active:bg-blue-400/20" : "bg-card border-border active:bg-muted"
                  }`}
                  onClick={() => setDraftQuotes(prev => new Set([...prev, quote.id]))}
                >
                  <Clipboard size={17} className={isDraft ? "text-blue-400" : "text-muted-foreground"} />
                  <span className={`text-sm font-semibold ${isDraft ? "text-blue-400" : "text-muted-foreground"}`}>
                    {isDraft ? "Draft saved ✓ — save again?" : "Save as draft"}
                  </span>
                </button>
              </div>
            )}

            <div className="h-4" />
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN SHELL ── */
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-3 border-b border-border bg-sidebar">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Alpine Fresh</p>
            <p className="text-foreground text-lg font-bold">Good morning, Ryan</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-medium">AI Online</span>
            </span>
            <button className="relative p-2 active:bg-muted rounded-xl transition-colors">
              <Bell size={18} className="text-muted-foreground" />
              {urgentCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400" />}
            </button>
            <button
              className="p-2 active:bg-muted rounded-xl transition-colors"
              onClick={() => setScreen("settings")}
            >
              <Settings size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* TODAY */}
        {tab === "home" && (
          <div className="p-4 space-y-5">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
                Action queue · {actionItems.filter(i => !actionStates[i.id]).length} pending
              </p>
              <div className="space-y-3">
                {actionItems.slice(0, 5).filter(item => !actionStates[item.id]).map(item => {
                  const isUrgent = item.priority === "urgent";
                  const isReady = item.priority === "accepted" || item.priority === "ready-invoice";
                  const borderCls = isUrgent ? "border-red-400/30" : isReady ? "border-emerald-400/25" : "border-amber-400/20";
                  const badgeCls = isUrgent ? "text-red-400 bg-red-400/10" : isReady ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10";
                  const isExpanded = mobileExpandedCard === item.id;
                  // Find linked job for this action item
                  const itemCustomer = CUSTOMERS.find(c => c.name === item.customer);
                  const linkedActionJob = itemCustomer ? jobs.find(j => j.customerId === itemCustomer.id) ?? JOBS.find(j => j.customerId === itemCustomer.id) : null;

                  const ALL_OPTIONS: Array<{ icon: React.ElementType; label: string; muted?: boolean; onTap: () => void }> = [
                    { icon: Check,         label: "Mark as done",     muted: true, onTap: () => { setActionStates(prev => ({ ...prev, [item.id]: "done" })); setMobileExpandedCard(null); } },
                    { icon: RefreshCw,     label: "Snooze for later", muted: true, onTap: () => { setActionStates(prev => ({ ...prev, [item.id]: "snoozed" })); setMobileExpandedCard(null); } },
                    { icon: Phone,         label: "Call customer",        onTap: () => setActionStates(prev => ({ ...prev, [item.id]: "called" })) },
                    { icon: MessageSquare, label: "Send SMS",             onTap: () => setActionStates(prev => ({ ...prev, [item.id]: "called" })) },
                    { icon: Inbox,         label: "Open in Inbox",        onTap: () => { if (item.linkedId?.startsWith("conv")) { setSelectedConvId(item.linkedId); setScreen("conv-detail"); } else { setTab("inbox"); setScreen("inbox"); } } },
                    { icon: FileText,      label: "View quote",           onTap: () => { if (item.linkedId?.startsWith("q")) { setSelectedQuoteId(item.linkedId); setScreen("quote-detail"); } else { setTab("quotes"); setScreen("quotes"); } } },
                    { icon: Briefcase,     label: "View job",             onTap: () => { if (item.linkedId?.startsWith("j")) { setSelectedJobId(item.linkedId); setScreen("job-detail"); } else { setTab("jobs"); setScreen("jobs"); } } },
                    { icon: Users,         label: "View customer",        onTap: () => { setTab("inbox"); setScreen("inbox"); } },
                    { icon: Calendar,      label: "Open calendar",        onTap: () => { setTab("home"); setScreen("home"); } },
                    { icon: DollarSign,    label: "Create invoice draft", onTap: () => setActionStates(prev => ({ ...prev, [item.id]: "done" })) },
                    { icon: Edit2,         label: "Add a note",           onTap: () => { if (item.linkedId?.startsWith("j")) { setSelectedJobId(item.linkedId); setScreen("job-detail"); } } },
                  ];

                  return (
                    <div key={item.id} className={`bg-card border ${borderCls} rounded-2xl p-4`}>
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{item.label}</span>
                        <p className="text-foreground text-sm font-semibold">{item.customer}</p>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed mb-3">{item.summary}</p>

                      {/* Primary action */}
                      <button
                        className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors mb-2 ${
                          isUrgent ? "bg-red-400/15 text-red-400 active:bg-red-400/25 border border-red-400/25" :
                          isReady ? "bg-blue-500 text-white active:bg-blue-400" :
                          "bg-secondary border border-border text-foreground active:bg-muted"
                        }`}
                        onClick={() => {
                          if (item.linkedId?.startsWith("conv")) { setSelectedConvId(item.linkedId); setScreen("conv-detail"); }
                          else if (item.linkedId?.startsWith("q")) { setSelectedQuoteId(item.linkedId); setScreen("quote-detail"); }
                          else if (item.linkedId?.startsWith("j")) { setSelectedJobId(item.linkedId); setScreen("job-detail"); }
                          else setActionStates(prev => ({ ...prev, [item.id]: "done" }));
                        }}
                      >
                        {isUrgent ? <Phone size={16} /> : isReady ? <CheckCircle size={16} /> : <Eye size={16} />}
                        {item.primaryAction}
                      </button>

                      {/* Open existing job or create new one */}
                      <button
                        className={`w-full py-3 rounded-xl flex items-center gap-3 px-4 active:bg-muted transition-colors border ${
                          linkedActionJob ? "bg-secondary border-border" : "bg-emerald-400/5 border-emerald-400/20"
                        }`}
                        onClick={() => {
                          if (linkedActionJob) { setSelectedJobId(linkedActionJob.id); setScreen("job-detail"); }
                          else { setTab("jobs"); setScreen("jobs"); }
                        }}
                      >
                        <Briefcase size={16} className={linkedActionJob ? "text-blue-400 flex-shrink-0" : "text-emerald-400 flex-shrink-0"} />
                        <div className="flex-1 text-left min-w-0">
                          {linkedActionJob ? (
                            <>
                              <p className="text-foreground text-xs font-semibold truncate">{linkedActionJob.title}</p>
                              <p className="text-muted-foreground text-[10px]">{linkedActionJob.date} · {linkedActionJob.time} · {linkedActionJob.suburb}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-foreground text-xs font-semibold">No job created yet</p>
                              <p className="text-muted-foreground text-[10px]">Tap to create a job ticket</p>
                            </>
                          )}
                        </div>
                        <span className={`text-xs font-semibold flex-shrink-0 ${linkedActionJob ? "text-blue-400" : "text-emerald-400"}`}>
                          {linkedActionJob ? "Open →" : "+ Create"}
                        </span>
                      </button>

                      {/* Other toggle */}
                      <button
                        className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-accent transition-colors"
                        onClick={() => setMobileExpandedCard(isExpanded ? null : item.id)}
                      >
                        {isExpanded ? <ChevronDown size={13} className="rotate-180" /> : <ChevronDown size={13} />}
                        {isExpanded ? "Less options" : "Other options"}
                      </button>

                      {/* Expanded options — full list, large tap targets */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide mb-2">All options</p>
                          {ALL_OPTIONS.map(({ icon: Icon, label, muted, onTap }) => (
                            <button
                              key={label}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left active:opacity-70 ${
                                muted
                                  ? "bg-card border-border text-muted-foreground"
                                  : "bg-secondary border-border text-foreground"
                              }`}
                              onClick={() => { onTap(); if (!["Snooze for later", "Mark as done"].includes(label)) setMobileExpandedCard(null); }}
                            >
                              <Icon size={17} className={muted ? "text-muted-foreground" : "text-foreground opacity-70"} />
                              <span className="text-sm font-medium">{label}</span>
                              <ChevronRight size={15} className="ml-auto text-muted-foreground opacity-50" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {actionItems.filter(i => !actionStates[i.id]).length === 0 && (
                  <div className="bg-card border border-border rounded-2xl p-5 text-center">
                    <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-foreground text-sm font-semibold">All clear</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Nothing needs your attention right now.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              {/* Week selector */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-0.5">
                {([
                  { id: "today" as const, label: "Today", dates: ["Today"] },
                  { id: "week" as const, label: "This week", dates: ["Today", "Tomorrow", "Friday"] },
                  { id: "next" as const, label: "Next week", dates: ["Next Monday", "Next Tuesday", "Next Wednesday"] },
                ] as const).map(period => {
                  const count = period.dates.reduce((n, d) => n + JOBS.filter(j => j.date === d).length, 0);
                  return (
                    <button
                      key={period.id}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                        jobPeriod === period.id
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-card border border-border text-muted-foreground active:bg-muted"
                      }`}
                      onClick={() => setJobPeriod(period.id)}
                    >
                      {period.label}
                      {count > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${jobPeriod === period.id ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Job list for selected period */}
              {(() => {
                const periodDates: Record<string, string[]> = {
                  today: ["Today"],
                  week: ["Today", "Tomorrow", "Friday"],
                  next: ["Next Monday", "Next Tuesday", "Next Wednesday", "Unscheduled"],
                };
                const periodLabels: Record<string, string> = {
                  Today: "Today",
                  Tomorrow: "Tomorrow",
                  Friday: "Friday",
                  "Next Monday": "Mon", "Next Tuesday": "Tue", "Next Wednesday": "Wed",
                  Unscheduled: "Unscheduled",
                };
                const filteredJobs = JOBS.filter(j => periodDates[jobPeriod].includes(j.date));
                if (filteredJobs.length === 0) {
                  return (
                    <div className="bg-card border border-border rounded-2xl p-6 text-center">
                      <Calendar size={24} className="text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-foreground text-sm font-semibold">No jobs scheduled</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {jobPeriod === "next" ? "Nothing booked next week yet." : "No jobs for this period."}
                      </p>
                    </div>
                  );
                }
                // Group by date
                const grouped: Record<string, typeof JOBS> = {};
                filteredJobs.forEach(j => {
                  if (!grouped[j.date]) grouped[j.date] = [];
                  grouped[j.date].push(j);
                });
                return (
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([date, jobs]) => (
                      <div key={date}>
                        {jobPeriod !== "today" && (
                          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide mb-1.5 px-1">
                            {periodLabels[date] ?? date}
                          </p>
                        )}
                        <div className="space-y-2">
                          {jobs.map(job => {
                            const isDone = completedJobs.has(job.id);
                            return (
                              <div key={job.id} className="w-full bg-card border border-border rounded-2xl p-4">
                                {/* Tap top area to open job */}
                                <div
                                  className="flex items-start justify-between mb-2 cursor-pointer active:opacity-70 transition-opacity"
                                  onClick={() => goToJob(job.id)}
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-foreground font-bold text-sm flex-shrink-0">{job.time}</span>
                                      {job.urgency === "Urgent" && (
                                        <span className="text-red-400 text-[10px] font-bold bg-red-400/10 px-1.5 py-0.5 rounded-full flex-shrink-0">⚡ Urgent</span>
                                      )}
                                    </div>
                                    <p className="text-foreground text-sm font-semibold truncate">{job.customer}</p>
                                    <p className="text-muted-foreground text-xs">{job.suburb} · {job.type}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <Badge label={isDone ? "Complete" : job.status} cls={isDone ? "text-emerald-400 bg-emerald-400/10" : statusStyle(job.status)} />
                                    <span className="text-muted-foreground text-xs">{fmtRange(job.value)}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button className="flex-1 py-2 rounded-lg bg-blue-500/10 border border-blue-500/15 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1 active:bg-blue-500/20">
                                    <Phone size={12} /> Call
                                  </button>
                                  <button className="flex-1 py-2 rounded-lg bg-secondary border border-border text-muted-foreground text-xs font-semibold flex items-center justify-center gap-1 active:bg-muted">
                                    <MapPin size={12} /> Navigate
                                  </button>
                                  <button
                                    className="flex-1 py-2 rounded-lg bg-secondary border border-border text-muted-foreground text-xs font-semibold flex items-center justify-center gap-1 active:bg-muted"
                                    onClick={() => goToJob(job.id)}
                                  >
                                    <Eye size={12} /> Open
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* INBOX */}
        {tab === "inbox" && (
          <div className="p-4 space-y-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              {urgentCount} need attention
            </p>
            {conversations.map(conv => {
              const isUrgent = conv.status === "urgent";
              const needsHuman = conv.status === "needs-human";
              const chanLabel: Record<string, string> = { sms: "SMS", email: "Email", web: "Web form", handoff: "AI escalation", call: "Call" };
              return (
                <button key={conv.id}
                  className={`w-full bg-card border rounded-2xl p-4 text-left active:bg-muted transition-colors ${isUrgent ? "border-red-400/30" : needsHuman ? "border-amber-400/25" : "border-border"}`}
                  onClick={() => goToConv(conv.id)}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold text-sm truncate">{conv.name}</p>
                      <p className="text-muted-foreground text-[11px]">{chanLabel[conv.channel] ?? conv.channel} · {conv.time}</p>
                    </div>
                    <div className="flex gap-1.5 ml-2 flex-shrink-0 items-center">
                      {isUrgent && <span className="text-red-400 text-[10px] font-bold bg-red-400/10 px-1.5 py-0.5 rounded-full">Urgent</span>}
                      {needsHuman && <span className="text-amber-400 text-[10px] font-bold bg-amber-400/10 px-1.5 py-0.5 rounded-full">Review</span>}
                      {conv.unread > 0 && <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">{conv.unread}</span>}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs line-clamp-1 mb-2">{conv.preview}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stageColor(conv.journey.currentStage)}`}>
                    {conv.journey.currentStage}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* JOBS */}
        {tab === "jobs" && (
          <div className="p-4 space-y-3">
            {/* Header + create button */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {jobs.length + createdJobs.length} jobs
              </p>
              <button
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold active:bg-blue-400 transition-colors"
                onClick={() => setCreateJobOpen(true)}
              >
                <Plus size={14} /> Create job
              </button>
            </div>

            {/* Newly created jobs (from this session) */}
            {createdJobs.map(job => (
              <div key={job.id} className="bg-card border border-blue-500/20 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-foreground font-semibold text-sm flex-1 truncate pr-2">{job.title}</p>
                  <Badge label="New" cls="text-blue-400 bg-blue-400/10" />
                </div>
                <p className="text-muted-foreground text-xs">{job.customer} · {job.suburb}</p>
                <p className="text-muted-foreground text-xs">{job.date} · {job.time}</p>
                {job.urgency === "Urgent" && (
                  <span className="text-red-400 text-[10px] font-bold mt-1.5 inline-block">⚡ Urgent</span>
                )}
              </div>
            ))}

            {/* Existing jobs */}
            {jobs.map(job => {
              const isDone = completedJobs.has(job.id);
              return (
                <button key={job.id}
                  className="w-full bg-card border border-border rounded-2xl p-4 text-left active:bg-muted transition-colors"
                  onClick={() => goToJob(job.id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-foreground font-semibold text-sm flex-1 truncate pr-2">{job.title}</p>
                    <Badge label={isDone ? "Complete" : job.status} cls={isDone ? "text-emerald-400 bg-emerald-400/10" : statusStyle(job.status)} />
                  </div>
                  <p className="text-muted-foreground text-xs">{job.customer} · {job.suburb}</p>
                  <p className="text-muted-foreground text-xs">{job.date} · {job.time} · {fmtRange(job.value)}</p>
                  {job.urgency === "Urgent" && (
                    <span className="text-red-400 text-[10px] font-bold mt-1.5 inline-block">⚡ Urgent</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* QUOTES */}
        {tab === "quotes" && (
          <div className="p-4 space-y-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              {quotes.filter(q => q.status === "Needs approval").length} need approval
            </p>
            {quotes.map(q => {
              const isSent = quoteSent.has(q.id);
              const isDraft = draftQuotes.has(q.id);
              const isSubmittedForReview = invoicesSubmitted.has(q.id);
              const linkedJob = jobs.find(j => j.customerId === q.customerId) ?? JOBS.find(j => j.customerId === q.customerId);
              const hasTechData = linkedJob && (
                (jobNotes[linkedJob.id] || "").length > 0 ||
                (jobMaterials[linkedJob.id] || []).length > 0 ||
                (jobPhotos[linkedJob.id] || 0) > 0
              );
              const statusLabel = isSent ? "Sent ✓" : isSubmittedForReview ? "Awaiting owner review" : isDraft ? "Draft saved" : q.status;
              const statusCls = isSent ? "text-emerald-400 bg-emerald-400/10" : isSubmittedForReview ? "text-violet-400 bg-violet-400/10" : isDraft ? "text-blue-400 bg-blue-400/10" : statusStyle(q.status);
              const borderCls = isSent ? "border-emerald-400/20" : isSubmittedForReview ? "border-violet-400/20" : (q.status === "Needs approval" && !isSent) ? "border-amber-400/30" : "border-border";
              return (
                <button
                  key={q.id}
                  className={`w-full bg-card border rounded-2xl p-4 text-left active:bg-muted transition-colors ${borderCls}`}
                  onClick={() => { setSelectedQuoteId(q.id); setScreen("quote-edit"); }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-blue-400 text-xs font-bold">{q.num}</span>
                        <Badge label={statusLabel} cls={statusCls} />
                      </div>
                      <p className="text-foreground font-bold text-base truncate">{q.customer}</p>
                      <p className="text-muted-foreground text-xs">{q.jobType}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-foreground font-extrabold text-lg leading-none">{fmtRange(q.amount)}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{q.created}</p>
                    </div>
                  </div>

                  {/* Tech data indicator */}
                  {hasTechData && (
                    <div className="flex items-center gap-2 mb-2">
                      {(jobNotes[linkedJob!.id] || "").length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full font-medium">
                          <Edit2 size={9} /> Notes
                        </span>
                      )}
                      {(jobMaterials[linkedJob!.id] || []).length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full font-medium">
                          <Wrench size={9} /> {(jobMaterials[linkedJob!.id] || []).length} items
                        </span>
                      )}
                      {(jobPhotos[linkedJob!.id] || 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-full font-medium">
                          <Upload size={9} /> {jobPhotos[linkedJob!.id]} photos
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA hint */}
                  <p className={`text-xs font-semibold ${isSent ? "text-emerald-400" : isSubmittedForReview ? "text-violet-400" : "text-blue-400"}`}>
                    {isSent ? "Invoice sent — tap to view"
                      : isSubmittedForReview ? "Submitted — owner to review and send"
                      : isDraft ? "Draft saved — tap to edit and send"
                      : "Tap to edit and send →"}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* AI */}
        {tab === "ai" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.from === "ai" && (
                    <span className="w-7 h-7 rounded-full bg-violet-400/15 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Bot size={13} className="text-violet-400" />
                    </span>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.from === "ai" ? "bg-card border border-border text-foreground" : "bg-blue-500 text-white"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div className="pt-2 space-y-2">
                {["What needs my attention?", "Jobs today", "Quote follow-ups", "Revenue this week"].map(p => (
                  <button key={p}
                    className="w-full text-left px-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm active:bg-muted transition-colors"
                    onClick={() => { setAiInput(p); setTimeout(() => { sendAiMessage(); setAiInput(""); }, 10); }}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border bg-sidebar flex gap-2">
              <input
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                placeholder="Ask anything…"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendAiMessage(); }}
              />
              <button className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center active:bg-blue-400" onClick={sendAiMessage}>
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {/* ── CREATE JOB BOTTOM SHEET ── */}
      {createJobOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setCreateJobOpen(false); }}
        >
          <div className="bg-card w-full rounded-t-2xl border-t border-border max-h-[90vh] overflow-y-auto">
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <h2 className="text-foreground font-bold text-lg">Create job</h2>
              <button className="p-2 text-muted-foreground active:text-foreground" onClick={() => setCreateJobOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Customer */}
              <div>
                <label className="text-foreground text-sm font-semibold block mb-1.5">Customer name</label>
                <div className="relative">
                  <select
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                    value={newJob.customer}
                    onChange={e => setNewJob(p => ({ ...p, customer: e.target.value }))}
                  >
                    <option value="">Select customer…</option>
                    {CUSTOMERS.map(c => (
                      <option key={c.id} value={c.name}>{c.name} — {c.suburb}</option>
                    ))}
                    <option value="new">+ New customer</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Job type */}
              <div>
                <label className="text-foreground text-sm font-semibold block mb-1.5">Job type</label>
                <div className="relative">
                  <select
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                    value={newJob.jobType}
                    onChange={e => setNewJob(p => ({ ...p, jobType: e.target.value }))}
                  >
                    <option value="">Select job type…</option>
                    {["Chimney sweep", "Water tank clean", "Gutter clean", "Roof moss treatment", "Plumbing", "HVAC repair", "Emergency callout", "Other"].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Suburb */}
              <div>
                <label className="text-foreground text-sm font-semibold block mb-1.5">Suburb / address</label>
                <input
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                  placeholder="e.g. Albury NSW or 14 Maple St, Wodonga"
                  value={newJob.suburb}
                  onChange={e => setNewJob(p => ({ ...p, suburb: e.target.value }))}
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground text-sm font-semibold block mb-1.5">Date</label>
                  <div className="relative">
                    <select
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                      value={newJob.date}
                      onChange={e => setNewJob(p => ({ ...p, date: e.target.value }))}
                    >
                      <option value="">Choose…</option>
                      {["Today", "Tomorrow", "Friday", "Monday", "Tuesday", "Wednesday", "Thursday"].map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-foreground text-sm font-semibold block mb-1.5">Time</label>
                  <div className="relative">
                    <select
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-blue-500/40 appearance-none"
                      value={newJob.time}
                      onChange={e => setNewJob(p => ({ ...p, time: e.target.value }))}
                    >
                      <option value="">Choose…</option>
                      {["7:00 AM","8:00 AM","8:30 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="text-foreground text-sm font-semibold block mb-2">Urgency</label>
                <div className="flex gap-2">
                  {["Normal", "Medium", "Urgent"].map(u => (
                    <button
                      key={u}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        newJob.urgency === u
                          ? u === "Urgent" ? "bg-red-400/15 border-red-400/25 text-red-400" : u === "Medium" ? "bg-amber-400/15 border-amber-400/25 text-amber-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-secondary border-border text-muted-foreground active:bg-muted"
                      }`}
                      onClick={() => setNewJob(p => ({ ...p, urgency: u }))}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-foreground text-sm font-semibold block mb-1.5">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm resize-none focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                  rows={3}
                  placeholder="What does this job involve? Any special instructions?"
                  value={newJob.notes}
                  onChange={e => setNewJob(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* Create button */}
              <button
                className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 transition-colors ${
                  newJob.customer && newJob.jobType && newJob.date
                    ? "bg-blue-500 text-white active:bg-blue-400"
                    : "bg-muted text-muted-foreground"
                }`}
                disabled={!newJob.customer || !newJob.jobType || !newJob.date}
                onClick={() => {
                  if (!newJob.customer || !newJob.jobType || !newJob.date) return;
                  const created = {
                    id: `new-${Date.now()}`,
                    title: `${newJob.jobType}${newJob.customer ? ` — ${newJob.customer.split(" ")[0]}` : ""}`,
                    customer: newJob.customer,
                    customerId: CUSTOMERS.find(c => c.name === newJob.customer)?.id || "",
                    suburb: newJob.suburb || "TBC",
                    address: newJob.suburb || "Address TBC",
                    time: newJob.time || "TBC",
                    date: newJob.date,
                    status: "New",
                    type: newJob.jobType,
                    value: [0, 0] as [number, number],
                    tech: "Ryan Thomas",
                    urgency: newJob.urgency,
                    source: "Manual",
                    confidence: 100,
                    aiNote: newJob.notes,
                  };
                  setCreatedJobs(prev => [created, ...prev]);
                  setNewJob({ customer: "", jobType: "", suburb: "", date: "", time: "", urgency: "Normal", notes: "" });
                  setCreateJobOpen(false);
                }}
              >
                <Briefcase size={18} />
                {newJob.customer && newJob.jobType && newJob.date ? `Create job — ${newJob.jobType}` : "Fill in the required fields"}
              </button>

              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border pb-safe flex-shrink-0 bg-sidebar">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex-1 flex flex-col items-center gap-1 pt-3 pb-4 transition-colors relative ${tab === id ? "text-blue-400" : "text-muted-foreground"}`}
              onClick={() => { setTab(id); setScreen(id); }}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
              {id === "inbox" && urgentCount > 0 && (
                <span className="absolute top-2 right-[calc(50%-18px)] w-4 h-4 rounded-full bg-red-400 text-white text-[9px] font-bold flex items-center justify-center">
                  {urgentCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROLE SELECTOR ───────────────────────────────────────────────────────────

function RoleSelector({ onSelect }: { onSelect: (r: "owner" | "technician") => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-3">
            <Zap size={24} className="text-white" />
          </div>
          <p className="text-foreground font-bold text-2xl">RyanOS</p>
          <p className="text-muted-foreground text-sm mt-1">Alpine Fresh Property Maintenance</p>
        </div>
        <p className="text-foreground font-semibold text-sm mb-3 text-center">Who are you logging in as?</p>
        <div className="space-y-3">
          <button className="w-full bg-card border border-border rounded-2xl p-5 text-left active:bg-muted transition-colors"
            onClick={() => onSelect("owner")}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-400/15 flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-bold text-base">Owner / Manager</p>
                <p className="text-muted-foreground text-sm">Dashboard, quotes, inbox, settings</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
            </div>
          </button>
          <button className="w-full bg-card border border-border rounded-2xl p-5 text-left active:bg-muted transition-colors"
            onClick={() => onSelect("technician")}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Wrench size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-bold text-base">Field Technician</p>
                <p className="text-muted-foreground text-sm">Today's jobs, notes, photos, mark complete</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
            </div>
          </button>
        </div>
        <p className="text-muted-foreground text-xs text-center mt-6">Powered by RyanOS · Alpine Fresh v1.0</p>
      </div>
    </div>
  );
}

// ─── TECHNICIAN APP ───────────────────────────────────────────────────────────

function TechnicianApp({ onSubmit, onSwitchRole }: {
  onSubmit: (data: { jobId: string; customerName: string; jobTitle: string; notes: string; internalNote: string; extra: string; flagged: boolean; materials: Array<{ id: string; desc: string; cost: number }>; photos: number }) => void;
  onSwitchRole: () => void;
}) {
  const { jobs } = useJobs();
  type TechScreen = "home" | "job" | "notes" | "complete" | "conversation";
  const [screen, setScreen] = useState<TechScreen>("home");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobStatuses, setJobStatuses] = useState<Record<string, "assigned" | "on-way" | "arrived" | "working" | "complete">>({});
  const [techNotes, setTechNotes] = useState<Record<string, { work: string; internal: string; extra: string; flagged: boolean }>>({});
  const [techMaterials, setTechMaterials] = useState<Record<string, Array<{ id: string; desc: string; cost: number }>>>({});
  const [techPhotos, setTechPhotos] = useState<Record<string, number>>({});
  const [newMatDesc, setNewMatDesc] = useState("");
  const [newMatCost, setNewMatCost] = useState("");
  const [submittedJobs, setSubmittedJobs] = useState<Set<string>>(new Set());
  const [techReplies, setTechReplies] = useState<Record<string, string[]>>({});
  const [techReplyInput, setTechReplyInput] = useState("");

  const myJobs = jobs.filter(j => ["Today", "Tomorrow", "Friday"].includes(j.date));
  const job = jobs.find(j => j.id === selectedJobId) ?? JOBS.find(j => j.id === selectedJobId);
  const status = selectedJobId ? (jobStatuses[selectedJobId] || "assigned") : "assigned";
  const notes = selectedJobId ? (techNotes[selectedJobId] || { work: "", internal: "", extra: "", flagged: false }) : { work: "", internal: "", extra: "", flagged: false };
  const materials = selectedJobId ? (techMaterials[selectedJobId] || []) : [];
  const photos = selectedJobId ? (techPhotos[selectedJobId] || 0) : 0;
  const matTotal = materials.reduce((s, m) => s + m.cost, 0);

  const STATUS_STEPS = [
    { id: "assigned", label: "Assigned" },
    { id: "on-way", label: "On my way" },
    { id: "arrived", label: "Arrived" },
    { id: "working", label: "Working" },
    { id: "complete", label: "Complete" },
  ] as const;

  const addMaterial = () => {
    if (!newMatDesc.trim() || !selectedJobId) return;
    setTechMaterials(prev => ({
      ...prev,
      [selectedJobId]: [...(prev[selectedJobId] || []), { id: Date.now().toString(), desc: newMatDesc.trim(), cost: Number(newMatCost) || 0 }],
    }));
    setNewMatDesc(""); setNewMatCost("");
  };

  const updateNotes = (field: keyof typeof notes, val: string | boolean) => {
    if (!selectedJobId) return;
    setTechNotes(prev => ({ ...prev, [selectedJobId]: { ...notes, [field]: val } }));
  };

  const submitJob = () => {
    if (!job || !selectedJobId) return;
    onSubmit({ jobId: selectedJobId, customerName: job.customer, jobTitle: job.title, notes: notes.work, internalNote: notes.internal, extra: notes.extra, flagged: notes.flagged, materials, photos });
    setSubmittedJobs(prev => new Set([...prev, selectedJobId]));
  };

  const urgencyDot = (u: string) => u === "Urgent" ? "bg-red-400" : u === "Medium" ? "bg-amber-400" : "bg-emerald-400";

  /* ── COMPLETE SUMMARY ── */
  if (screen === "complete" && job && selectedJobId) {
    const isSubmitted = submittedJobs.has(selectedJobId);
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground active:text-foreground" onClick={() => setScreen("job")}>
            <ChevronLeft size={22} />
          </button>
          <p className="text-foreground font-bold text-base flex-1">Job summary</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-3">What you captured</p>
            <div className="space-y-2.5">
              {[
                { icon: Edit2, label: "Work performed", val: notes.work || "No notes added", color: notes.work ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-muted" },
                { icon: Edit2, label: "Internal note", val: notes.internal || "None", color: notes.internal ? "text-blue-400 bg-blue-400/10" : "text-muted-foreground bg-muted" },
                { icon: Wrench, label: `Materials (${materials.length})`, val: materials.length > 0 ? `${materials.length} items · $${matTotal}` : "None added", color: materials.length > 0 ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground bg-muted" },
                { icon: Upload, label: `Photos (${photos})`, val: photos > 0 ? `${photos} photo${photos !== 1 ? "s" : ""} attached` : "No photos", color: photos > 0 ? "text-violet-400 bg-violet-400/10" : "text-muted-foreground bg-muted" },
                { icon: AlertTriangle, label: "Extra work found", val: notes.extra || "None", color: notes.extra ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground bg-muted" },
              ].map(({ icon: Icon, label, val, color }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={12} />
                  </span>
                  <div>
                    <p className="text-muted-foreground text-[11px] font-semibold">{label}</p>
                    <p className="text-foreground text-xs leading-relaxed line-clamp-2">{val}</p>
                  </div>
                </div>
              ))}
              {notes.flagged && (
                <div className="flex items-center gap-2 bg-red-400/8 border border-red-400/15 rounded-xl px-3 py-2">
                  <AlertTriangle size={13} className="text-red-400" />
                  <p className="text-red-400 text-xs font-semibold">Flagged for owner review</p>
                </div>
              )}
            </div>
          </div>

          {!isSubmitted ? (
            <div className="space-y-3">
              <button
                className="w-full py-4 rounded-2xl bg-blue-500 flex items-center justify-center gap-3 active:bg-blue-400 transition-colors"
                onClick={submitJob}
              >
                <Send size={20} className="text-white" />
                <span className="text-white font-bold text-base">Send to owner</span>
              </button>
              <p className="text-muted-foreground text-xs text-center">The owner will review your notes and create the invoice.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={22} className="text-emerald-400" />
                  <p className="text-emerald-400 font-bold text-lg">Sent to owner ✓</p>
                </div>
                <p className="text-foreground text-sm leading-relaxed">
                  RyanOS will prepare this for invoice and review. You're done — great work.
                </p>
              </div>
              <button
                className="w-full py-3.5 rounded-2xl bg-secondary border border-border text-foreground text-sm font-semibold active:bg-muted transition-colors"
                onClick={() => { setScreen("home"); setSelectedJobId(null); }}
              >
                Back to jobs
              </button>
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>
    );
  }

  /* ── NOTES SCREEN ── */
  if (screen === "notes" && job && selectedJobId) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground active:text-foreground" onClick={() => setScreen("job")}>
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-xs">Notes for</p>
            <p className="text-foreground font-bold text-base truncate">{job.customer}</p>
          </div>
          <button
            className="px-3 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold active:bg-blue-400"
            onClick={() => setScreen("job")}
          >
            Save
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Work performed */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Edit2 size={14} className="text-blue-400" />
              <p className="text-foreground text-sm font-semibold">Work performed</p>
              <span className="text-muted-foreground text-xs ml-auto">Shown to owner</span>
            </div>
            <div className="p-4">
              <textarea
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                rows={4}
                placeholder="What work did you do? What did you find? What was replaced or repaired?"
                value={notes.work}
                onChange={e => updateNotes("work", e.target.value)}
              />
            </div>
          </div>

          {/* Internal note */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Edit2 size={14} className="text-muted-foreground" />
              <p className="text-foreground text-sm font-semibold">Internal note</p>
              <span className="text-muted-foreground text-xs ml-auto">Not on invoice</span>
            </div>
            <div className="p-4">
              <textarea
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                rows={2}
                placeholder="Anything the owner should know — access issues, customer comments, follow-up needed"
                value={notes.internal}
                onChange={e => updateNotes("internal", e.target.value)}
              />
            </div>
          </div>

          {/* Extra work found */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              <p className="text-foreground text-sm font-semibold">Extra work found</p>
              <span className="text-muted-foreground text-xs ml-auto">Optional</span>
            </div>
            <div className="p-4">
              <textarea
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                rows={2}
                placeholder="Did you find anything extra that needs quoting or a return visit?"
                value={notes.extra}
                onChange={e => updateNotes("extra", e.target.value)}
              />
            </div>
          </div>

          {/* Materials */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={14} className="text-amber-400" />
                <p className="text-foreground text-sm font-semibold">Materials used</p>
              </div>
              {matTotal > 0 && <span className="text-foreground text-sm font-bold">${matTotal}</span>}
            </div>
            <div className="p-4 space-y-3">
              {materials.map(m => (
                <div key={m.id} className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2.5">
                  <p className="text-foreground text-sm flex-1">{m.desc}</p>
                  <p className="text-muted-foreground text-sm">{m.cost > 0 ? `$${m.cost}` : "—"}</p>
                  <button className="text-muted-foreground active:text-red-400 p-1"
                    onClick={() => setTechMaterials(prev => ({ ...prev, [selectedJobId]: materials.filter(x => x.id !== m.id) }))}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
                  placeholder="Item name"
                  value={newMatDesc}
                  onChange={e => setNewMatDesc(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMaterial(); } }}
                />
                <input
                  className="w-20 bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40"
                  placeholder="$"
                  type="number"
                  value={newMatCost}
                  onChange={e => setNewMatCost(e.target.value)}
                />
                <button className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold active:bg-blue-400" onClick={addMaterial}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload size={14} className="text-violet-400" />
                <p className="text-foreground text-sm font-semibold">Photos</p>
              </div>
              {photos > 0 && <span className="text-violet-400 text-xs font-semibold">{photos} added</span>}
            </div>
            <div className="p-4">
              {photos > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {Array.from({ length: photos }).map((_, i) => (
                    <div key={i} className="aspect-square bg-secondary border border-border rounded-xl flex items-center justify-center relative">
                      <Upload size={14} className="text-muted-foreground" />
                      <button className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center"
                        onClick={() => setTechPhotos(prev => ({ ...prev, [selectedJobId]: Math.max(0, photos - 1) }))}>
                        <X size={10} className="text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 active:bg-muted hover:border-blue-500/30 hover:text-blue-400 transition-colors"
                onClick={() => setTechPhotos(prev => ({ ...prev, [selectedJobId]: photos + 1 }))}
              >
                <Upload size={15} /> Add photo
              </button>
            </div>
          </div>

          {/* Flags */}
          <div className="bg-card border border-border rounded-2xl px-5 py-1">
            <div className="flex items-start gap-4 py-4">
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">Flag for owner review</p>
                <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">Use this if you found a safety issue, something unexpected, or if you need the owner to make a decision before the invoice goes out.</p>
              </div>
              <button
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${notes.flagged ? "bg-red-400" : "bg-muted"}`}
                onClick={() => updateNotes("flagged", !notes.flagged)}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notes.flagged ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>
    );
  }

  /* ── JOB DETAIL ── */
  if (screen === "job" && job && selectedJobId) {
    const isSubmitted = submittedJobs.has(selectedJobId);
    const currentStepIdx = STATUS_STEPS.findIndex(s => s.id === status);
    const hasNotes = notes.work || notes.internal || notes.extra || materials.length > 0 || photos > 0;

    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground active:text-foreground" onClick={() => setScreen("home")}>
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-xs">{job.date} · {job.time}</p>
            <p className="text-foreground font-bold text-base truncate">{job.title}</p>
          </div>
          {job.urgency === "Urgent" && (
            <span className="text-red-400 text-[11px] font-bold bg-red-400/10 px-2 py-1 rounded-full flex-shrink-0">⚡ Urgent</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide mb-2">Customer</p>
            <p className="text-foreground font-bold text-lg">{job.customer}</p>
            <p className="text-muted-foreground text-sm mt-0.5">{job.address}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button className="py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center gap-2 active:bg-blue-500/20">
                <Phone size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-semibold">Call</span>
              </button>
              <button className="py-3 rounded-xl bg-secondary border border-border flex items-center justify-center gap-2 active:bg-muted">
                <MapPin size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground text-sm font-semibold">Navigate</span>
              </button>
            </div>
          </div>

          {/* Status progress */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide mb-3">Job status</p>
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
              {STATUS_STEPS.map((step, i) => {
                const done = i < currentStepIdx;
                const active = i === currentStepIdx;
                return (
                  <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                    <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      active ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" :
                      done ? "bg-emerald-400/10 text-emerald-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {done ? "✓ " : ""}{step.label}
                    </div>
                    {i < STATUS_STEPS.length - 1 && <ChevronRight size={10} className="text-muted-foreground/40" />}
                  </div>
                );
              })}
            </div>
            {status !== "complete" && (
              <button
                className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-bold active:bg-blue-400 transition-colors"
                onClick={() => {
                  const next = STATUS_STEPS[currentStepIdx + 1];
                  if (next) setJobStatuses(prev => ({ ...prev, [selectedJobId]: next.id }));
                }}
              >
                {currentStepIdx === 0 ? "→ I'm on my way" :
                 currentStepIdx === 1 ? "→ I've arrived" :
                 currentStepIdx === 2 ? "→ Started working" :
                 "→ Mark job complete"}
              </button>
            )}
          </div>

          {/* Job instructions */}
          {job.aiNote && (
            <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-4">
              <p className="text-violet-400 text-[11px] font-semibold mb-2">Job instructions</p>
              <p className="text-foreground text-sm leading-relaxed">{job.aiNote}</p>
            </div>
          )}

          {/* Safety note */}
          <div className="bg-amber-400/5 border border-amber-400/15 rounded-2xl px-4 py-3 flex gap-2.5">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-400 text-xs leading-relaxed">
              Safety first. If you find anything unsafe — gas, electrical risk, structural damage, or anything that puts you or the customer at risk — stop work and call the owner immediately.
            </p>
          </div>

          {/* Notes summary */}
          {hasNotes && (
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-emerald-400 text-xs font-semibold">Notes captured</p>
                <p className="text-muted-foreground text-[11px]">
                  {[notes.work && "Work notes", materials.length > 0 && `${materials.length} materials`, photos > 0 && `${photos} photos`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button className="text-blue-400 text-xs font-semibold" onClick={() => setScreen("notes")}>Edit →</button>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5">
            {/* Conversation button — shows unread badge if messages exist */}
            {(() => {
              const linkedConv = conversations.find(c => c.customerId === job.customerId);
              const msgCount = linkedConv?.messages.filter(m => m.from === "customer").length || 0;
              return (
                <button
                  className="w-full py-4 rounded-2xl bg-secondary border border-border flex items-center gap-4 px-5 active:bg-muted transition-colors"
                  onClick={() => setScreen("conversation")}
                >
                  <MessageSquare size={18} className={linkedConv ? "text-violet-400" : "text-muted-foreground"} />
                  <div className="flex-1 text-left">
                    <p className="text-foreground font-semibold text-base">
                      {linkedConv ? "View customer conversation" : "No conversation"}
                    </p>
                    {linkedConv && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {linkedConv.journey.currentStage} · {msgCount} message{msgCount !== 1 ? "s" : ""}
                        {linkedConv.unread > 0 && ` · ${linkedConv.unread} unread`}
                      </p>
                    )}
                  </div>
                  {linkedConv?.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {linkedConv.unread}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </button>
              );
            })()}

            <button
              className="w-full py-4 rounded-2xl bg-secondary border border-border flex items-center justify-center gap-3 active:bg-muted transition-colors"
              onClick={() => setScreen("notes")}
            >
              <Edit2 size={18} className="text-blue-400" />
              <span className="text-foreground font-semibold text-base">{hasNotes ? "Edit notes & materials" : "Add notes & materials"}</span>
            </button>

            {status === "complete" && !isSubmitted && (
              <button
                className="w-full py-4 rounded-2xl bg-blue-500 flex items-center justify-center gap-3 active:bg-blue-400 transition-colors"
                onClick={() => setScreen("complete")}
              >
                <Send size={18} className="text-white" />
                <span className="text-white font-bold text-base">Review and send to owner</span>
              </button>
            )}

            {isSubmitted && (
              <div className="bg-emerald-400/8 border border-emerald-400/20 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-400" />
                <p className="text-emerald-400 font-semibold text-sm">Sent to owner ✓ — job complete</p>
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </div>
    );
  }

  /* ── CONVERSATION ── */
  if (screen === "conversation" && job) {
    const linkedConv = conversations.find(c => c.customerId === job.customerId);
    const replies = selectedJobId ? (techReplies[selectedJobId] || []) : [];

    const sendTechReply = () => {
      if (!techReplyInput.trim() || !selectedJobId) return;
      setTechReplies(prev => ({ ...prev, [selectedJobId]: [...(prev[selectedJobId] || []), techReplyInput.trim()] }));
      setTechReplyInput("");
    };

    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="px-4 pt-12 pb-3 border-b border-border bg-sidebar flex items-center gap-3">
          <button className="p-2 -ml-2 text-muted-foreground active:text-foreground" onClick={() => setScreen("job")}>
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground text-xs">Customer conversation</p>
            <p className="text-foreground font-bold text-base truncate">{job.customer}</p>
          </div>
          {linkedConv && (
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${stageColor(linkedConv.journey.currentStage)}`}>
              {linkedConv.journey.currentStage}
            </span>
          )}
        </div>

        {/* Journey context strip */}
        {linkedConv && (
          <div className="px-4 py-3 border-b border-border bg-violet-400/5">
            <div className="flex items-start gap-2">
              <ArrowRight size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-foreground text-xs leading-relaxed">{linkedConv.journey.nextAction}</p>
            </div>
            {linkedConv.journey.blocker && (
              <div className="flex items-start gap-2 mt-2">
                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-400 text-[11px] leading-relaxed">{linkedConv.journey.blocker}</p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {!linkedConv && (
            <div className="text-center py-8">
              <MessageSquare size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-muted-foreground text-sm">No conversation found for this customer.</p>
            </div>
          )}

          {linkedConv && [...linkedConv.messages, ...replies.map((r, i) => ({
            id: `tech-${i}`, from: "customer" as const, text: r, time: "Just now"
          }))].map(msg => {
            if (msg.from === "system") return (
              <div key={msg.id} className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <p className="text-muted-foreground text-[10px] px-2 flex-shrink-0">{msg.text}</p>
                <p className="text-muted-foreground text-[10px] flex-shrink-0">{msg.time}</p>
                <div className="flex-1 h-px bg-border" />
              </div>
            );
            return (
              <div key={msg.id} className={`flex gap-2 ${msg.from === "customer" ? "justify-start" : "justify-end"}`}>
                {msg.from === "customer" && (
                  <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-muted-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.from === "ai" ? "bg-violet-400/10 border border-violet-400/15 text-foreground rounded-tr-sm"
                  : "bg-card border border-border text-foreground rounded-tl-sm"
                }`}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: msg.from === "ai" ? "#A78BFA" : "#7F8998" }}>
                    {msg.from === "ai" ? "AI Receptionist" : job.customer} · {msg.time}
                  </p>
                  {msg.text}
                </div>
                {msg.from === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-violet-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-violet-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Read-only note + optional reply */}
        <div className="border-t border-border bg-sidebar px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-xl">
            <Bot size={12} className="text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground text-[11px]">For quotes and pricing queries, the owner will handle those. You can send a quick update SMS below.</p>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-blue-500/40 placeholder:text-muted-foreground"
              placeholder="Send a quick update to customer…"
              value={techReplyInput}
              onChange={e => setTechReplyInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendTechReply(); }}
            />
            <button
              className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center active:bg-blue-400"
              onClick={sendTechReply}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── HOME ── */
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="px-4 pt-10 pb-4 border-b border-border bg-sidebar">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Alpine Fresh · Field Technician</p>
            <p className="text-foreground text-xl font-bold">Today's Jobs</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-[11px] font-medium">Active</span>
            </span>
            <button className="p-2 text-muted-foreground active:text-foreground rounded-xl active:bg-muted" onClick={onSwitchRole}>
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {myJobs.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3 opacity-60" />
            <p className="text-foreground font-semibold">No jobs scheduled today</p>
            <p className="text-muted-foreground text-sm mt-1">Check with the office for updates.</p>
          </div>
        )}

        {/* Group by date */}
        {(["Today", "Tomorrow", "Friday"] as const).map(day => {
          const dayJobs = myJobs.filter(j => j.date === day);
          if (dayJobs.length === 0) return null;
          return (
            <div key={day}>
              {day !== "Today" && (
                <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide mb-2 px-1">{day}</p>
              )}
              <div className="space-y-3">
                {dayJobs.map(j => {
                  const st = jobStatuses[j.id] || "assigned";
                  const isSubmitted = submittedJobs.has(j.id);
                  return (
                    <div key={j.id} className={`bg-card border rounded-2xl overflow-hidden ${j.urgency === "Urgent" ? "border-red-400/25" : "border-border"}`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-foreground font-bold text-sm flex-shrink-0">{j.time}</span>
                              {j.urgency === "Urgent" && <span className="text-red-400 text-[10px] font-bold bg-red-400/10 px-1.5 py-0.5 rounded-full">⚡ Urgent</span>}
                              {isSubmitted && <span className="text-emerald-400 text-[10px] font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Sent ✓</span>}
                            </div>
                            <p className="text-foreground font-semibold text-base truncate">{j.customer}</p>
                            <p className="text-muted-foreground text-xs">{j.suburb} · {j.type}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`w-2.5 h-2.5 rounded-full ${urgencyDot(j.urgency)}`} />
                            <span className="text-muted-foreground text-[10px] capitalize">{st.replace("-", " ")}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button className="py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center gap-1.5 active:bg-blue-500/20">
                            <Phone size={14} className="text-blue-400" />
                            <span className="text-blue-400 text-[11px] font-semibold">Call</span>
                          </button>
                          <button className="py-2.5 rounded-xl bg-secondary border border-border flex items-center justify-center gap-1.5 active:bg-muted">
                            <MapPin size={14} className="text-muted-foreground" />
                            <span className="text-muted-foreground text-[11px] font-semibold">Navigate</span>
                          </button>
                          <button
                            className="py-2.5 rounded-xl bg-secondary border border-border flex items-center justify-center gap-1.5 active:bg-muted"
                            onClick={() => { setSelectedJobId(j.id); setScreen("job"); }}
                          >
                            <Eye size={14} className="text-muted-foreground" />
                            <span className="text-muted-foreground text-[11px] font-semibold">Open</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [userRole, setUserRole] = useState<"none" | "owner" | "technician">("none");
  const [techSubmissions, setTechSubmissions] = useState<Array<{
    id: string; jobId: string; customerName: string; jobTitle: string;
    notes: string; internalNote: string; extra: string; flagged: boolean;
    materials: Array<{ id: string; desc: string; cost: number }>;
    photos: number; submittedAt: string;
  }>>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const navigate = (s: Screen, id?: string) => {
    setScreen(s);
    if (id) setSelectedId(id);
    window.scrollTo(0, 0);
  };

  if (mobile && userRole === "none") return <RoleSelector onSelect={setUserRole} />;
  if (mobile && userRole === "technician") return (
    <TechnicianApp
      onSubmit={data => setTechSubmissions(prev => [{ ...data, id: `ts-${Date.now()}`, submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...prev])}
      onSwitchRole={() => setUserRole("none")}
    />
  );
  if (mobile) return <MobileApp />;

  const PAGE_TITLES: Partial<Record<Screen, { title: string; sub: string }>> = {
    dashboard: { title: "Dashboard", sub: "Thursday 26 June · Alpine Fresh Property Maintenance" },
    inbox: { title: "Inbox", sub: "All customer communications in one place" },
    calls: { title: "Calls", sub: "AI receptionist log" },
    "call-detail": { title: "Call detail", sub: "Transcript & AI summary" },
    jobs: { title: "Jobs", sub: "All jobs" },
    "job-detail": { title: "Job detail", sub: "" },
    customers: { title: "Customers", sub: "CRM" },
    "customer-detail": { title: "Customer profile", sub: "" },
    quotes: { title: "Quotes", sub: "Quote pipeline" },
    "quote-detail": { title: "Quote detail", sub: "Review & approve" },
    "quote-builder": { title: "New quote", sub: "Build and send a quote" },
    calendar: { title: "Calendar", sub: "Week view" },
    "ai-assistant": { title: "AI Assistant", sub: "Ask anything about your business" },
    settings: { title: "Settings", sub: "Business configuration" },
    "go-live": { title: "Go-live checklist", sub: "Ready to launch?" },
    "invoice-upload": { title: "Invoice upload", sub: "Onboarding" },
  };

  const pg = PAGE_TITLES[screen] ?? { title: screen, sub: "" };

  return (
    <div className={`bg-background min-h-screen ${theme === "light" ? "light" : ""}`}>
      <Sidebar screen={screen} onNavigate={navigate} />
      <TopBar title={pg.title} sub={pg.sub} onNavigate={navigate} theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />

      <main className="pl-60 pt-14 min-h-screen">
        {screen === "dashboard" && (
          <DashboardScreen onNavigate={navigate} onSelect={setSelectedId} techSubmissions={techSubmissions} />
        )}
        {screen === "inbox" && (
          <InboxScreen
            onNavigate={navigate}
            onSelect={setSelectedId}
            initialConvId={selectedId?.startsWith("conv") ? selectedId : undefined}
          />
        )}
        {screen === "calls" && (
          <CallsScreen onNavigate={navigate} onSelect={setSelectedId} />
        )}
        {screen === "call-detail" && (
          <CallDetailScreen
            callId={selectedId || "call1"}
            onBack={() => setScreen("inbox")}
            onNavigate={navigate}
            onSelect={setSelectedId}
          />
        )}
        {screen === "jobs" && (
          <JobsScreen onNavigate={navigate} onSelect={setSelectedId} />
        )}
        {screen === "job-detail" && (
          <JobDetailScreen
            jobId={selectedId || "j1"}
            onBack={() => setScreen("jobs")}
            onNavigate={navigate}
            onSelect={setSelectedId}
          />
        )}
        {screen === "customers" && (
          <CustomersScreen onNavigate={navigate} onSelect={setSelectedId} />
        )}
        {screen === "customer-detail" && (
          <CustomerDetailScreen
            customerId={selectedId || "c1"}
            onBack={() => setScreen("customers")}
          />
        )}
        {screen === "quotes" && (
          <QuotesScreen onNavigate={navigate} onSelect={setSelectedId} />
        )}
        {screen === "quote-detail" && (
          <QuoteDetailScreen
            quoteId={selectedId || "q1"}
            onBack={() => setScreen("quotes")}
            onNavigate={navigate}
          />
        )}
        {screen === "quote-builder" && (
          <QuoteBuilderScreen
            onBack={() => setScreen("quotes")}
            onNavigate={navigate}
            prefillCustomerId={selectedId && selectedId.startsWith("c") ? selectedId : undefined}
          />
        )}
        {screen === "calendar" && <CalendarScreen />}
        {screen === "ai-assistant" && <AIAssistantScreen />}
        {screen === "settings" && <SettingsScreen onNavigate={navigate} />}
        {screen === "go-live" && <GoLiveScreen onNavigate={navigate} />}
        {screen === "invoice-upload" && (
          <div className="p-7 max-w-lg">
            <h1 className="text-foreground text-xl font-bold mb-2">Upload past invoices</h1>
            <p className="text-muted-foreground text-sm mb-6">RyanOS reads your old invoices to learn how your business prices real jobs. This helps the AI give better estimate ranges and draft more accurate quotes.</p>
            <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-blue-500/30 transition-colors cursor-pointer">
              <Upload size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-semibold text-sm">Drag invoices here or click to upload</p>
              <p className="text-muted-foreground text-xs mt-1">PDF, CSV, XLSX, or images · Up to 50 files</p>
              <Btn variant="secondary" style={{ marginTop: 16 }}>Browse files</Btn>
            </div>
            <p className="text-muted-foreground text-xs mt-4 text-center">Your invoices are stored securely and only used to train your pricing model.</p>
          </div>
        )}
      </main>
    </div>
  );
}
