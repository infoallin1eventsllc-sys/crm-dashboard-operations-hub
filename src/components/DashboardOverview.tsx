import React, { useState, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { QuickCaptureWidget } from "./QuickCaptureWidget";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { 
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { 
  Users, 
  Target, 
  Briefcase, 
  FileText, 
  DollarSign, 
  Video, 
  ListTodo, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Zap,
  Clock,
  Info,
  Sparkles,
  Coffee,
  MailOpen,
  Mail,
  Loader2
} from "lucide-react";

interface KPITooltipProps {
  id: string;
  title: string;
  definition: string;
  tip?: string;
  active: boolean;
  onToggle: () => void;
  onLeave: () => void;
}

const KPITooltip: React.FC<KPITooltipProps> = ({ id, title, definition, tip, active, onToggle, onLeave }) => {
  return (
    <div className="relative inline-block ml-1.5 align-middle" onMouseLeave={onLeave} id={`tooltip-container-${id}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onMouseEnter={onToggle}
        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-hidden inline-flex items-center justify-center p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        title={`View info for ${title}`}
        id={`tooltip-trigger-${id}`}
      >
        <Info size={13} className="stroke-[2.5]" />
      </button>

      {active && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3.5 bg-slate-950 dark:bg-slate-850 border border-slate-800 dark:border-slate-700 text-white rounded-lg shadow-xl z-50 text-left animate-in fade-in slide-in-from-bottom-1 duration-150"
          id={`tooltip-content-${id}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-950 dark:border-t-slate-850"></div>
          
          <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-400 mb-1">
            Metric Definition
          </div>
          <h4 className="font-sans font-bold text-xs text-slate-100 mb-1">{title}</h4>
          <p className="font-sans text-[11px] leading-relaxed text-slate-300 mb-2">
            {definition}
          </p>
          {tip && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 dark:border-slate-700/60 flex items-start gap-1">
              <span className="text-[10px] text-emerald-400 shrink-0 mt-0.5">💡</span>
              <p className="text-[10px] font-sans italic text-slate-400 leading-normal">
                {tip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { 
    leads, 
    contacts, 
    projects, 
    invoices, 
    subscriptions, 
    todoTasks, 
    activityLogs,
    meetEvents,
    isPrivacyMode,
    togglePrivacyMode,
    gmailMessages = [],
    markEmailAsRead,
    updateTodoTask,
    updateInvoice
  } = useCRM();

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [digestSummary, setDigestSummary] = useState("");
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState("");

  const generateDailyDigestSummary = async () => {
    setIsDigestLoading(true);
    setDigestError("");
    try {
      const pendingTasks = todoTasks.filter(t => t.status !== "Done");
      const unpaidInvoices = invoices.filter(i => ["Sent", "Overdue"].includes(i.status));
      const unreadEmails = gmailMessages.filter(g => !g.isRead);

      const promptText = `You are an expert executive assistant and business intelligence agent.
Review the following CRM status data for today:

PENDING TASKS:
${pendingTasks.length === 0 ? "- No pending tasks today." : pendingTasks.map(t => `- [${t.priority}] ${t.title} (Due: ${t.dueDate || "N/A"})`).join("\n")}

UPCOMING & OVERDUE INVOICES:
${unpaidInvoices.length === 0 ? "- No outstanding unpaid invoices." : unpaidInvoices.map(i => `- Invoice ${i.invoiceNumber} for client ${i.contactName}: $${i.amount} (Due: ${i.dueDate}, Status: ${i.status})`).join("\n")}

UNREAD GMAIL MESSAGES:
${unreadEmails.length === 0 ? "- No unread email threads." : unreadEmails.map(m => `- From: ${m.fromName || m.from}, Subject: "${m.subject}"`).join("\n")}

Please generate a brief, encouraging, highly concise and actionable briefing / Daily Operations Digest (maximum of 4 bullet points, around 100-150 words total).
Structure:
- Acknowledge high-priority tasks, overdue invoices, or key customer emails first.
- Keep the tone encouraging, professional, and business-focused.
- Do NOT include any introductory preamble (like "Here is your briefing") or closing signature. Jump directly into the bullet points.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI Assistant.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setDigestSummary(data.text || "No summary was generated by the AI.");
    } catch (err: any) {
      console.error(err);
      setDigestError(err.message || "Something went wrong generating the operations digest.");
    } finally {
      setIsDigestLoading(false);
    }
  };

  useEffect(() => {
    if (!activeTooltip) return;
    const handleGlobalClick = () => {
      setActiveTooltip(null);
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [activeTooltip]);

  // Calculations
  const activeLeadsValue = leads
    .filter(l => ["New", "Contacted", "Qualified", "Proposal"].includes(l.status))
    .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  const activeLeadsCount = leads.filter(l => ["New", "Contacted", "Qualified", "Proposal"].includes(l.status)).length;

  const monthlySubscriptionSpend = subscriptions
    .filter(s => s.status === "Active")
    .reduce((sum, s) => {
      const cost = Number(s.cost) || 0;
      return sum + (s.billingCycle === "Monthly" ? cost : cost / 12);
    }, 0);

  const paidInvoicesTotal = invoices
    .filter(i => i.status === "Paid")
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const pendingInvoicesTotal = invoices
    .filter(i => ["Sent", "Overdue"].includes(i.status))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const totalProjects = projects.length;
  const projectCompletionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  const todoPendingCount = todoTasks.filter(t => t.status !== "Done").length;

  // Dynamic calculations for Key Performance Indicators
  const totalActiveLeadsCount = leads.filter(l => l.status !== "Won" && l.status !== "Lost").length;

  const currentMonthYearStr = new Date().toISOString().substring(0, 7); // e.g., "2026-06"
  const monthlyInvoiceValueTotal = invoices
    .filter(i => {
      const created = i.createdAt ? i.createdAt.substring(0, 7) : "";
      const due = i.dueDate ? i.dueDate.substring(0, 7) : "";
      return created === currentMonthYearStr || due === currentMonthYearStr;
    })
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const pendingTasksCountNum = todoTasks.filter(t => t.status !== "Done").length;

  // --- PROJECTED REVENUE RECHARTS CALCULATIONS ---
  const PROBABILITY_MAP: Record<string, number> = {
    "New": 0.15,
    "Contacted": 0.30,
    "Qualified": 0.50,
    "Proposal": 0.75
  };

  const getEffectiveCloseMonth = (lead: any) => {
    if (lead.expectedCloseMonth) return lead.expectedCloseMonth;
    // Heuristic fallback
    if (["Proposal", "Qualified"].includes(lead.status)) {
      return "Current";
    }
    return "Next";
  };

  const getMonthNames = () => {
    const current = new Date();
    const next = new Date();
    next.setMonth(current.getMonth() + 1);
    
    const formatter = new Intl.DateTimeFormat("en-US", { month: "long" });
    return {
      current: formatter.format(current),
      next: formatter.format(next)
    };
  };

  const currentMonths = getMonthNames();

  const activeLeadsInPipeline = leads.filter(l => 
    ["New", "Contacted", "Qualified", "Proposal"].includes(l.status)
  );

  const currentMonthLeads = activeLeadsInPipeline.filter(l => 
    getEffectiveCloseMonth(l) === "Current"
  );

  const nextMonthLeads = activeLeadsInPipeline.filter(l => 
    getEffectiveCloseMonth(l) === "Next"
  );

  const currentMonthTotalValue = currentMonthLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const currentMonthProjected = currentMonthLeads.reduce((sum, l) => {
    const prob = PROBABILITY_MAP[l.status] || 0;
    return sum + ((Number(l.value) || 0) * prob);
  }, 0);

  const nextMonthTotalValue = nextMonthLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const nextMonthProjected = nextMonthLeads.reduce((sum, l) => {
    const prob = PROBABILITY_MAP[l.status] || 0;
    return sum + ((Number(l.value) || 0) * prob);
  }, 0);

  const projectedChartData = [
    {
      name: currentMonths.current,
      "Total Pipeline Value": currentMonthTotalValue,
      "Weighted Projected Revenue": Math.round(currentMonthProjected)
    },
    {
      name: currentMonths.next,
      "Total Pipeline Value": nextMonthTotalValue,
      "Weighted Projected Revenue": Math.round(nextMonthProjected)
    }
  ];

  const CustomProjectedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 dark:bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium flex items-center gap-1">
              <span>●</span>
              <span>{entry.name}:</span>
              <span className="font-bold">
                {isPrivacyMode ? "••••" : `$${entry.value.toLocaleString()}`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- DAILY DIGEST CALCULATIONS ---
  const pendingTasks = todoTasks.filter(t => t.status !== "Done");
  const getPriorityScore = (priority: string) => {
    if (priority === "High") return 3;
    if (priority === "Medium") return 2;
    return 1;
  };
  const sortedPendingTasks = [...pendingTasks].sort((a, b) => {
    return getPriorityScore(b.priority) - getPriorityScore(a.priority);
  });

  const unpaidInvoices = invoices.filter(i => ["Sent", "Overdue"].includes(i.status));
  const sortedUnpaidInvoices = [...unpaidInvoices].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const unreadGmail = gmailMessages.filter(g => !g.isRead);

  return (
    <div className="space-y-6">
      {/* Privacy Mode Banner */}
      {isPrivacyMode && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">
          <ShieldAlert size={16} className="shrink-0" />
          <p>
            All sensitive figures, names, company references, and contact details are currently blurred on screen. Hover over a blurred field to reveal it.
          </p>
        </div>
      )}

      {/* Daily Digest Dashboard Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4" id="daily-digest-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👋</span>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                Welcome back, Drew!
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Your business pipeline is synced. Review today's operations briefing below.
            </p>
          </div>
          <button
            onClick={generateDailyDigestSummary}
            disabled={isDigestLoading}
            className="bg-[#00AC76] hover:bg-[#009163] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isDigestLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Synthesizing briefing...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="stroke-[2.5]" />
                <span>Generate Daily Operations Digest</span>
              </>
            )}
          </button>
        </div>

        {/* AI Briefing Summary Box */}
        {(digestSummary || isDigestLoading || digestError) && (
          <div className="bg-[#F8FAF9] border border-[#E2F0EA] p-5 rounded-2xl relative overflow-hidden animate-in fade-in duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none text-5xl">
              ✨
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#00AC76] mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="fill-current" />
              AI Operations Briefing summary
            </h4>
            {isDigestLoading ? (
              <div className="flex items-center gap-2 py-2">
                <span className="w-4 h-4 border-2 border-[#00AC76] border-t-transparent rounded-full animate-spin"></span>
                <p className="text-xs text-[#6C8E82] italic">Reviewing pending tasks, overdue invoices, and unread mail to compose your personalized morning guidance...</p>
              </div>
            ) : digestError ? (
              <p className="text-xs text-rose-500">{digestError}</p>
            ) : (
              <div className="text-xs text-[#112F24] leading-relaxed font-medium whitespace-pre-line bg-white/70 p-3 rounded-xl border border-[#E2F0EA]">
                {digestSummary}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Responsive Layout Split - Main Area (Left) vs Profile Area (Right) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* ================= LEFT MAIN COLUMN: ANALYTICS & STATS ================= */}
        <div className="flex-1 w-full space-y-6">

          {/* B. Analytical Charts Row (Area Projections + Donut Pie) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projected Pipeline Revenue (Line Chart area) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E2F0EA] p-5 shadow-[0_8px_30px_rgba(0,172,118,0.01)] space-y-4" id="projected-revenue-card">
              <div className="flex justify-between items-center border-b border-[#F0F6F3] pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-[#112F24] flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#00AC76]" />
                    Revenue Projections
                  </h3>
                  <p className="text-[11px] text-[#6C8E82]">Expected sales weighted by stage probabilities</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-[#E2FAF0] text-[#008A5E] font-bold px-2 py-0.5 rounded font-mono uppercase">PROJECTIONS</span>
                </div>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00AC76" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#00AC76" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F6F3" />
                    <XAxis dataKey="name" tick={{ fill: '#6C8E82', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6C8E82', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => isPrivacyMode ? "••••" : `$${val.toLocaleString()}`} />
                    <Tooltip content={<CustomProjectedTooltip />} cursor={{ stroke: '#E2F0EA', strokeWidth: 1 }} />
                    <Area name="Total Pipeline Value" type="monotone" dataKey="Total Pipeline Value" stroke="#94a3b8" fillOpacity={1} fill="url(#colorPipeline)" strokeWidth={2} />
                    <Area name="Weighted Projected Revenue" type="monotone" dataKey="Weighted Projected Revenue" stroke="#00AC76" fillOpacity={1} fill="url(#colorProjected)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-[#F0F6F3]">
                <div>
                  <p className="text-[10px] text-[#6C8E82] uppercase tracking-wider font-semibold font-mono">{currentMonths.current} Forecast</p>
                  <p className="text-sm font-extrabold text-[#112F24] mt-0.5">
                    Weighted: <span className="text-[#00AC76]"><PrivateText type="money">${Math.round(currentMonthProjected).toLocaleString()}</PrivateText></span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6C8E82] uppercase tracking-wider font-semibold font-mono">{currentMonths.next} Forecast</p>
                  <p className="text-sm font-extrabold text-[#112F24] mt-0.5">
                    Weighted: <span className="text-blue-600"><PrivateText type="money">${Math.round(nextMonthProjected).toLocaleString()}</PrivateText></span>
                  </p>
                </div>
              </div>
            </div>

          {/* Column 2: Invoice Deadlines */}
            {/* Customers Pie Donut Chart */}
            <div className="bg-white rounded-3xl border border-[#E2F0EA] p-5 shadow-[0_8px_30px_rgba(0,172,118,0.01)] flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#112F24] flex items-center gap-2 border-b border-[#F0F6F3] pb-2">
                  <Target size={16} className="text-[#00AC76]" />
                  Sales Distribution
                </h3>
              </div>

              <div className="h-32 flex items-center justify-center relative my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "New", value: leads.filter(l => l.status === "New").length || 1 },
                        { name: "Contacted", value: leads.filter(l => l.status === "Contacted").length || 1 },
                        { name: "Qualified", value: leads.filter(l => l.status === "Qualified").length || 1 },
                        { name: "Proposal", value: leads.filter(l => l.status === "Proposal").length || 1 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={52}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#94A3B8" />
                      <Cell fill="#00AC76" />
                      <Cell fill="#34D399" />
                      <Cell fill="#112F24" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <p className="text-lg font-black text-[#112F24]">{leads.length}</p>
                  <p className="text-[8px] font-bold text-[#6C8E82] uppercase tracking-wider">Prospects</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-bold text-[#6C8E82]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
                  <span className="truncate">New ({leads.filter(l => l.status === "New").length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00AC76]"></span>
                  <span className="truncate">Contacted ({leads.filter(l => l.status === "Contacted").length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#34D399]"></span>
                  <span className="truncate">Qualified ({leads.filter(l => l.status === "Qualified").length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#112F24]"></span>
                  <span className="truncate">Proposal ({leads.filter(l => l.status === "Proposal").length})</span>
                </div>
              </div>
            </div>
          </div>

      {/* Key Performance Indicators (KPIs) Row */}
      <div className="space-y-4" id="kpi-panel">
        <div className="flex items-center justify-between border-b border-[#F0F6F3] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#112F24] flex items-center gap-2">
            <TrendingUp size={14} className="text-[#00AC76]" />
            Key Performance Indicators
          </h3>
          <span className="text-[10px] font-mono text-[#6C8E82]">Real-time analytics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="kpi-metrics-grid">
          {/* KPI Card 1: Total Active Leads */}
          <div className="bg-white border border-[#E2F0EA] p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] hover:shadow-[0_8px_30px_rgba(0,172,118,0.03)] transition duration-200" id="kpi-card-active-leads">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <p className="text-[#6C8E82] text-xs font-bold uppercase tracking-wider">Total Active Leads</p>
                  <KPITooltip 
                    id="active-leads"
                    title="Total Active Leads"
                    definition="The number of pipeline leads currently in active negotiation stages (New, Contacted, Qualified, Proposal). Finished outcomes (Won, Lost) are excluded."
                    tip="Pro Tip: Keep contacting 'New' leads within 24 hours to maximize qualification rates."
                    active={activeTooltip === "active-leads"}
                    onToggle={() => setActiveTooltip(activeTooltip === "active-leads" ? null : "active-leads")}
                    onLeave={() => setActiveTooltip(null)}
                  />
                </div>
                <h3 className="text-3xl font-black mt-1 text-[#112F24]">
                  <PrivateText>{totalActiveLeadsCount}</PrivateText>
                </h3>
                <p className="text-[11px] text-[#6C8E82] mt-2 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00AC76] animate-pulse"></span>
                  Active prospects in pipeline
                </p>
              </div>
              <div className="bg-[#E2FAF0] p-2.5 rounded-xl text-[#008A5E]">
                <Target size={20} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* KPI Card 2: Monthly Invoice Value */}
          <div className="bg-white border border-[#E2F0EA] p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] hover:shadow-[0_8px_30px_rgba(0,172,118,0.03)] transition duration-200" id="kpi-card-monthly-invoice">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <p className="text-[#6C8E82] text-xs font-bold uppercase tracking-wider">Monthly Invoice Value</p>
                  <KPITooltip 
                    id="monthly-invoice"
                    title="Monthly Invoice Value"
                    definition="The cumulative sum of all invoices created or falling due in the current calendar month. It provides a real-time estimate of your short-term billing and cash flow expectations."
                    tip="Pro Tip: Send automated reminders for unpaid invoices approaching their due dates."
                    active={activeTooltip === "monthly-invoice"}
                    onToggle={() => setActiveTooltip(activeTooltip === "monthly-invoice" ? null : "monthly-invoice")}
                    onLeave={() => setActiveTooltip(null)}
                  />
                </div>
                <h3 className="text-3xl font-black mt-1 text-[#112F24]">
                  <PrivateText type="money">
                    ${monthlyInvoiceValueTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </PrivateText>
                </h3>
                <p className="text-[11px] text-[#6C8E82] mt-2 font-medium">
                  Invoiced in current month
                </p>
              </div>
              <div className="bg-[#E2FAF0] p-2.5 rounded-xl text-[#008A5E]">
                <DollarSign size={20} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* KPI Card 3: Pending Tasks Count */}
          <div className="bg-white border border-[#E2F0EA] p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] hover:shadow-[0_8px_30px_rgba(0,172,118,0.03)] transition duration-200" id="kpi-card-pending-tasks">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <p className="text-[#6C8E82] text-xs font-bold uppercase tracking-wider">Pending Tasks Count</p>
                  <KPITooltip 
                    id="pending-tasks"
                    title="Pending Tasks Count"
                    definition="The total volume of outstanding tasks on your board that are currently in 'Todo' or 'In Progress' states. Represents active work on plate."
                    tip="Pro Tip: Delegate lower-priority tasks to balance workload and meet deadlines."
                    active={activeTooltip === "pending-tasks"}
                    onToggle={() => setActiveTooltip(activeTooltip === "pending-tasks" ? null : "pending-tasks")}
                    onLeave={() => setActiveTooltip(null)}
                  />
                </div>
                <h3 className="text-3xl font-black mt-1 text-[#112F24]">
                  <PrivateText>{pendingTasksCountNum}</PrivateText>
                </h3>
                <p className="text-[11px] text-[#6C8E82] mt-2 font-medium">
                  Active assignments on board
                </p>
              </div>
              <div className="bg-[#E2FAF0] p-2.5 rounded-xl text-[#008A5E]">
                <ListTodo size={20} className="stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Active Leads Value */}
        <div className="bg-white border border-[#E2F0EA] p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] hover:shadow-[0_8px_30px_rgba(0,172,118,0.03)] transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#6C8E82] text-xs font-bold uppercase tracking-wider">Active Pipeline</p>
              <h3 className="text-2xl font-black mt-1 text-[#112F24]">
                <PrivateText type="money">
                  ${activeLeadsValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </PrivateText>
              </h3>
              <p className="text-[11px] text-[#6C8E82] mt-2 flex items-center gap-1 font-medium">
                <span className="text-[#00AC76] font-extrabold">{activeLeadsCount}</span> active deals in funnel
              </p>
            </div>
            <div className="bg-[#E2FAF0] p-2.5 rounded-xl text-[#008A5E]">
              <Target size={18} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* KPI 2: Software Subscription Expenses */}
        <div className="bg-white border border-[#E2F0EA] p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] hover:shadow-[0_8px_30px_rgba(0,172,118,0.03)] transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#6C8E82] text-xs font-bold uppercase tracking-wider">Subscription Cost</p>
              <h3 className="text-2xl font-black mt-1 text-[#112F24]">
                <PrivateText type="money">
                  ${monthlySubscriptionSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </PrivateText>
                <span className="text-xs font-bold text-[#6C8E82]">/mo</span>
              </h3>
              <p className="text-[11px] text-[#6C8E82] mt-2 font-medium">
                Across {subscriptions.filter(s => s.status === "Active").length} active business SaaS tools
              </p>
            </div>
            <div className="bg-[#E2FAF0] p-2.5 rounded-xl text-[#008A5E]">
              <DollarSign size={18} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* KPI 3: Invoiced/Outstanding */}
        <div className="bg-white border border-[#E2F0EA] p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] hover:shadow-[0_8px_30px_rgba(0,172,118,0.03)] transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#6C8E82] text-xs font-bold uppercase tracking-wider">Total Received</p>
              <h3 className="text-2xl font-black mt-1 text-[#112F24]">
                <PrivateText type="money">
                  ${paidInvoicesTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </PrivateText>
              </h3>
              <p className="text-[11px] text-[#6C8E82] mt-2 font-medium">
                Outstanding: <span className="text-[#00AC76] font-extrabold"><PrivateText type="money">${pendingInvoicesTotal.toLocaleString()}</PrivateText></span>
              </p>
            </div>
            <div className="bg-[#E2FAF0] p-2.5 rounded-xl text-[#008A5E]">
              <FileText size={18} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* KPI 4: Projects & Tasks */}
        <div className="bg-white border border-[#E2F0EA] p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] hover:shadow-[0_8px_30px_rgba(0,172,118,0.03)] transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#6C8E82] text-xs font-bold uppercase tracking-wider">Project Completion</p>
              <h3 className="text-2xl font-black mt-1 text-[#112F24]">
                {projectCompletionRate}%
              </h3>
              <p className="text-[11px] text-[#6C8E82] mt-2 font-medium">
                {completedProjects} of {totalProjects} completed • {todoPendingCount} pending
              </p>
            </div>
            <div className="bg-[#E2FAF0] p-2.5 rounded-xl text-[#008A5E]">
              <Briefcase size={18} className="stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Projected Revenue Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4" id="projected-revenue-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-emerald-500" />
              Projected Pipeline Revenue
            </h3>
            <p className="text-[11px] text-slate-400">
              Expected sales closure values weighted by stage probability for the current and upcoming month
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded">
              <span>New: 15%</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded">
              <span>Contacted: 30%</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded">
              <span>Qualified: 50%</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/40 px-2 py-1 rounded">
              <span>Proposal: 75%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Detailed Statistics List */}
          <div className="lg:col-span-2 space-y-4 flex flex-col justify-center">
            {/* Current Month Statistics */}
            <div className="border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {currentMonths.current} Forecast
                </span>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                  {currentMonthLeads.length} Leads
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Pipeline Value</p>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    <PrivateText type="money">${currentMonthTotalValue.toLocaleString()}</PrivateText>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Weighted Projection</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <PrivateText type="money">${Math.round(currentMonthProjected).toLocaleString()}</PrivateText>
                  </p>
                </div>
              </div>
            </div>

            {/* Next Month Statistics */}
            <div className="border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {currentMonths.next} Forecast
                </span>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                  {nextMonthLeads.length} Leads
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Pipeline Value</p>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                    <PrivateText type="money">${nextMonthTotalValue.toLocaleString()}</PrivateText>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Weighted Projection</p>
                  <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    <PrivateText type="money">${Math.round(nextMonthProjected).toLocaleString()}</PrivateText>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic leading-relaxed">
              * Note: Expected close month can be set on each lead in the pipeline tab to refine this projection dynamically.
            </p>
          </div>

          {/* Recharts Bar Chart */}
          <div className="lg:col-span-3 h-[240px]" id="projected-revenue-recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectedChartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => isPrivacyMode ? "••••" : `$${val.toLocaleString()}`}
                />
                <Tooltip content={<CustomProjectedTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 500 }}
                />
                <Bar 
                  dataKey="Total Pipeline Value" 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={50} 
                />
                <Bar 
                  dataKey="Weighted Projected Revenue" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={50} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Global Interactive Analytics Deck */}
      <DashboardAnalytics />

      {/* Main Grid: Upcoming Meets, Quick Actions & Recent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Meetings & Quick Links (Span 1) */}
        <div className="space-y-6">
          
          {/* Upcoming Meets */}
          <div className="bg-white border border-[#E2F0EA] rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-[#112F24] text-sm flex items-center gap-2">
                <Video size={18} className="text-[#00AC76]" />
                Google Meets Events
              </h3>
              <button 
                onClick={() => onNavigate("leads")}
                className="text-xs text-[#00AC76] hover:text-[#009163] font-bold flex items-center gap-0.5 transition cursor-pointer"
              >
                Schedule <ArrowRight size={12} />
              </button>
            </div>

            {meetEvents.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#E2F0EA] rounded-2xl">
                <Video size={24} className="mx-auto text-[#6C8E82] opacity-50 mb-2" />
                <p className="text-xs text-[#6C8E82]">No upcoming meetings scheduled.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="border border-[#E2F0EA] p-3 rounded-2xl bg-[#F8FAF9]">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#112F24] truncate">{event.title}</h4>
                        <p className="text-[11px] text-[#6C8E82] mt-1 font-medium">
                          With: <span className="font-bold text-[#112F24]"><PrivateText type="name">{event.contactName}</PrivateText></span>
                        </p>
                      </div>
                      <span className="bg-[#E2FAF0] text-[#008A5E] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Clock size={10} /> {event.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#E2F0EA]">
                      <span className="text-[10px] font-mono text-[#6C8E82] font-semibold">{event.date}</span>
                      <a 
                        href={event.meetLink}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-[11px] bg-[#00AC76] hover:bg-[#009163] text-white font-extrabold px-3 py-1 rounded-xl flex items-center gap-1 transition shadow-sm cursor-pointer"
                      >
                        <Video size={12} />
                        Join Meet
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instant Transaction & Record Capture Widget */}
          <QuickCaptureWidget />

          {/* Quick Actions Router Panel */}
          <div className="bg-white border border-[#E2F0EA] rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] p-5">
            <h3 className="font-extrabold text-[#112F24] text-sm flex items-center gap-2 mb-4">
              <Zap size={18} className="text-[#00AC76]" />
              Quick Workspace Links
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onNavigate("leads")}
                className="p-3 border border-[#E2F0EA] rounded-2xl text-left hover:bg-[#F8FAF9] transition cursor-pointer"
              >
                <Target className="text-[#00AC76] mb-1.5" size={16} />
                <p className="text-xs font-bold text-[#112F24]">Leads & Sales</p>
                <p className="text-[10px] text-[#6C8E82] font-medium mt-0.5">Manage pipeline</p>
              </button>
              <button 
                onClick={() => onNavigate("gmail")}
                className="p-3 border border-[#E2F0EA] rounded-2xl text-left hover:bg-[#F8FAF9] transition cursor-pointer"
              >
                <Video className="text-[#00AC76] mb-1.5" size={16} />
                <p className="text-xs font-bold text-[#112F24]">Gmail Inbox</p>
                <p className="text-[10px] text-[#6C8E82] font-medium mt-0.5">View & reply</p>
              </button>
              <button 
                onClick={() => onNavigate("todo")}
                className="p-3 border border-[#E2F0EA] rounded-2xl text-left hover:bg-[#F8FAF9] transition cursor-pointer"
              >
                <ListTodo className="text-[#00AC76] mb-1.5" size={16} />
                <p className="text-xs font-bold text-[#112F24]">Kanban Board</p>
                <p className="text-[10px] text-[#6C8E82] font-medium mt-0.5">{todoPendingCount} open tasks</p>
              </button>
              <button 
                onClick={() => onNavigate("subscriptions")}
                className="p-3 border border-[#E2F0EA] rounded-2xl text-left hover:bg-[#F8FAF9] transition cursor-pointer"
              >
                <DollarSign className="text-[#00AC76] mb-1.5" size={16} />
                <p className="text-xs font-bold text-[#112F24]">SaaS Spend</p>
                <p className="text-[10px] text-[#6C8E82] font-medium mt-0.5">Track subscriptions</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Log Feed & Real-time Timeline (Span 2) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#E2F0EA] rounded-3xl shadow-[0_8px_30px_rgba(0,172,118,0.015)] p-5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-extrabold text-[#112F24] text-sm flex items-center gap-2">
                  <Clock size={18} className="text-[#00AC76]" />
                  Active Operations Log
                </h3>
                <p className="text-xs text-[#6C8E82] mt-0.5">Real-time trace of modifications and sales actions</p>
              </div>
              <span className="bg-[#E2FAF0] text-[#008A5E] text-[10px] font-bold px-2 py-1 rounded-md">
                Live Feed
              </span>
            </div>

            {activityLogs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <Clock size={32} className="text-[#6C8E82] opacity-30 mb-2" />
                <p className="text-sm text-[#6C8E82]">No activity logged yet.</p>
                <p className="text-xs text-[#6C8E82] opacity-80 mt-1">Actions taken across CRM modules will appear here automatically.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-[420px]">
                {activityLogs.map((log) => {
                  let badgeColor = "bg-slate-100 text-slate-800";
                  if (log.type === "lead") badgeColor = "bg-[#E2FAF0] text-[#008A5E]";
                  if (log.type === "project") badgeColor = "bg-purple-50 text-purple-700";
                  if (log.type === "invoice") badgeColor = "bg-emerald-50 text-emerald-700";
                  if (log.type === "subscription") badgeColor = "bg-rose-50 text-rose-700";
                  if (log.type === "gmail") badgeColor = "bg-red-50 text-red-700";
                  if (log.type === "meet") badgeColor = "bg-sky-50 text-sky-700";

                  return (
                    <div key={log.id} className="flex gap-3 text-sm items-start border-b border-[#F0F6F3] pb-3 last:border-0 last:pb-0">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${badgeColor}`}>
                        {log.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-[#112F24]">{log.action}</p>
                        <p className="text-[#6C8E82] text-[11px] mt-0.5 font-medium">
                          {/* Wrap description variables in PrivateText if they might contain contacts or names */}
                          {log.description.includes("lead:") || log.description.includes("contact:") || log.description.includes("with") ? (
                            <PrivateText>{log.description}</PrivateText>
                          ) : (
                            log.description
                          )}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#6C8E82] shrink-0 font-mono font-bold">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

        {/* ================= RIGHT COLUMN: DREW'S PROFILE & PERSISTENT STATUS ================= */}
        <div className="w-full xl:w-80 shrink-0 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white border border-[#E2F0EA] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,172,118,0.015)] space-y-5 text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00AC76] to-[#34D399] flex items-center justify-center text-white font-black text-2xl shadow-inner">
                D
              </div>
              <span className="absolute bottom-0 right-1 w-5 h-5 bg-[#00AC76] border-4 border-white rounded-full flex items-center justify-center" title="Online Status">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
              </span>
            </div>
            
            <div>
              <h3 className="font-extrabold text-base text-[#112F24]">Drew</h3>
              <p className="text-[11px] font-bold text-[#00AC76] uppercase tracking-wider mt-0.5">Enterprise Event Operator</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8FAF9] border border-[#E2F0EA] rounded-full text-[11px] text-[#6C8E82] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00AC76]"></span>
                operations@crmconsulting.com
              </div>
            </div>

            <div className="border-t border-[#F0F6F3] pt-4 grid grid-cols-2 gap-2 text-left">
              <div className="bg-[#F8FAF9] p-3 rounded-2xl border border-[#E2F0EA]">
                <p className="text-[9px] font-bold text-[#6C8E82] uppercase tracking-wider">Cloud Engine</p>
                <p className="text-xs font-extrabold text-[#112F24] mt-0.5 truncate" title="Firestore DB">Firestore</p>
              </div>
              <div className="bg-[#F8FAF9] p-3 rounded-2xl border border-[#E2F0EA]">
                <p className="text-[9px] font-bold text-[#6C8E82] uppercase tracking-wider">Security</p>
                <p className="text-xs font-extrabold text-[#112F24] mt-0.5">Rules V2</p>
              </div>
            </div>

            {/* Privacy Mode Action */}
            <div className="bg-[#E2FAF0] border border-[#C5ECD9] p-3.5 rounded-2xl flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-extrabold text-[#008A5E]">Privacy Mode</p>
                <p className="text-[10px] text-[#008A5E]/80 mt-0.5">Mask values on screen</p>
              </div>
              <button 
                onClick={togglePrivacyMode}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPrivacyMode ? 'bg-[#00AC76]' : 'bg-[#C5ECD9]'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPrivacyMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Quick Stats Bento */}
          <div className="bg-white border border-[#E2F0EA] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,172,118,0.015)] space-y-4">
            <h4 className="font-extrabold text-xs text-[#112F24] uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} className="text-[#00AC76]" />
              CRM Core Guard
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6C8E82] font-semibold">Active Pipeline</span>
                <span className="font-black text-[#112F24] font-mono">{activeLeadsCount} Leads</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6C8E82] font-semibold">Overdue Invoices</span>
                <span className="font-black text-rose-600 font-mono">
                  {invoices.filter(i => i.status === "Overdue").length}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6C8E82] font-semibold">SaaS Subscriptions</span>
                <span className="font-black text-[#112F24] font-mono">
                  {subscriptions.filter(s => s.status === "Active").length} Active
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
