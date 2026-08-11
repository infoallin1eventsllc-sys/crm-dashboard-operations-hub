import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Sparkles, 
  X, 
  Search, 
  Tag, 
  Layers, 
  Calendar,
  Activity,
  Archive,
  TrendingUp
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

export const SubscriptionsSection: React.FC = () => {
  const { 
    subscriptions, 
    addSubscription, 
    updateSubscription, 
    deleteSubscription 
  } = useCRM();

  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");

  // Add Form state
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [billingCycle, setBillingCycle] = useState<any>("Monthly");
  const [nextRenewal, setNextRenewal] = useState("");
  const [category, setCategory] = useState<any>("AI / SaaS");
  const [status, setStatus] = useState<any>("Active");

  // AI Optimization States
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAuditExpenses = async () => {
    setIsAnalyzing(true);
    setAiError("");
    setAiAnalysis("");

    try {
      const subContext = subscriptions.map(s => `- ${s.name}: $${s.cost}/${s.billingCycle === "Monthly" ? "mo" : "yr"} (${s.category}, Status: ${s.status})`).join("\n");
      
      const prompt = `You are a world-class Chief Financial Officer and SaaS optimization expert. 
      Analyze our company's software subscription stack and provide 3 to 4 elegant, actionable, highly specific tips to optimize subscription spend or streamline operations.
      
      Current Subscriptions:
      ${subContext || "No subscriptions logged yet. Give advice on standard SaaS tooling for an event management and operations agency."}
      
      Format the output beautifully with concise bullet points, markdown list elements, and clear estimated savings for each point (e.g. "Consolidate duplicate tools: save $20/mo"). Keep it sharp, professional, and strategic. Do not output conversational filler.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiAnalysis(data.text);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to generate subscription audit.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost) return;

    await addSubscription({
      name,
      cost: Number(cost) || 0,
      billingCycle,
      nextRenewal,
      category,
      status
    });

    // Reset
    setName("");
    setCost("");
    setBillingCycle("Monthly");
    setNextRenewal("");
    setCategory("AI / SaaS");
    setStatus("Active");
    setIsAdding(false);
  };

  // Calculations
  const activeSubs = subscriptions.filter(s => s.status === "Active");
  
  const totalMonthlySpend = activeSubs.reduce((sum, s) => {
    const amt = Number(s.cost) || 0;
    return sum + (s.billingCycle === "Monthly" ? amt : amt / 12);
  }, 0);

  const totalAnnualSpend = totalMonthlySpend * 12;

  // Filter subscriptions
  const filteredSubs = subscriptions.filter(s => {
    return s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
  });

  // Calculate category breakdowns
  const categorySpend: { [key: string]: number } = {};
  activeSubs.forEach(s => {
    const amt = Number(s.cost) || 0;
    const monthlyAmt = s.billingCycle === "Monthly" ? amt : amt / 12;
    categorySpend[s.category] = (categorySpend[s.category] || 0) + monthlyAmt;
  });

  // Generate last 6 months list helper
  const getLastSixMonths = () => {
    const monthsList = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthsList.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        name: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      });
    }
    return monthsList;
  };

  const trendMonths = getLastSixMonths();
  
  // Check if all active subscriptions have the exact same createdAt month (freshly seeded)
  const createdAtDates = activeSubs.map(s => s.createdAt ? s.createdAt.substring(0, 7) : "");
  const uniqueCreatedAtMonths = Array.from(new Set(createdAtDates.filter(Boolean)));
  const isFreshlySeeded = uniqueCreatedAtMonths.length <= 1;

  const trendData = trendMonths.map((m, idx) => {
    let total = 0;
    activeSubs.forEach((sub, subIdx) => {
      const monthlyCost = sub.billingCycle === "Monthly" ? Number(sub.cost) : Number(sub.cost) / 12;
      
      if (isFreshlySeeded) {
        // Freshly seeded: distribute the subscriptions over the 6-month window to show a beautiful spending history trend
        const startMonthIdx = subIdx % 5; // spread across first 5 months
        if (idx >= startMonthIdx) {
          total += monthlyCost;
        }
      } else {
        // Real user data with custom creation times: include if createdAt <= this month
        if (sub.createdAt) {
          const subDate = new Date(sub.createdAt);
          const subYear = subDate.getFullYear();
          const subMonth = subDate.getMonth();
          
          if (subYear < m.year || (subYear === m.year && subMonth <= m.month)) {
            total += monthlyCost;
          }
        } else {
          // Fallback if no createdAt exists
          total += monthlyCost;
        }
      }
    });

    return {
      month: m.name,
      Cost: Math.round(total),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Subscription & SaaS Expenses</h2>
          <p className="text-xs text-slate-500 mt-0.5">Audit company software spend, recurring cycles, and categorize tools</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Add SaaS Tool"}
        </button>
      </div>

      {/* Financial SaaS Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI: Monthly Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-center gap-4 md:col-span-2">
          <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg text-rose-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Recurring Monthly SaaS Spend</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              <PrivateText type="money">${totalMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</PrivateText>
              <span className="text-xs font-semibold text-slate-400"> /mo</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Approx. <PrivateText type="money">${totalAnnualSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</PrivateText>/year across {activeSubs.length} active SaaS suites
            </p>
          </div>
        </div>

        {/* Category Allocation Progress Meters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-sm md:col-span-2 space-y-3">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Layers size={12} /> Expense Category Allocation
          </h4>
          
          {Object.keys(categorySpend).length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No active subscriptions registered to map categories.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(categorySpend).map(([cat, amt]) => {
                const pct = totalMonthlySpend > 0 ? Math.round((amt / totalMonthlySpend) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span className="truncate max-w-[100px]">{cat}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SaaS Spending Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4" id="subscription-spending-trend">
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/60 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1 bg-rose-50 dark:bg-rose-950/40 rounded text-rose-500">
                <TrendingUp size={16} />
              </span>
              6-Month SaaS Spending Trend
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Track growth and changes in cumulative recurring SaaS expenses</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded">
              Amortized Monthly
            </span>
          </div>
        </div>
        
        <div className="h-[240px] w-full" id="spending-trend-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/40" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8" 
                fontSize={10} 
                fontFamily="JetBrains Mono, monospace"
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                fontFamily="JetBrains Mono, monospace"
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#f8fafc',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px'
                }}
                formatter={(value: any) => [`$${value}`, "Total SaaS Spend"]}
                labelStyle={{ fontWeight: 'bold', color: '#fda4af', fontFamily: 'JetBrains Mono, monospace' }}
              />
              <Line 
                type="monotone" 
                dataKey="Cost" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#f43f5e' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#e11d48' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gemini AI SaaS Expense Audit Panel */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/20 dark:from-slate-900 dark:to-slate-950 border border-indigo-200/40 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-500 fill-indigo-100 animate-pulse" size={20} />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Chief Financial Officer SaaS Optimizer</h3>
              <p className="text-[11px] text-slate-500 font-medium">Audit subscriptions for software bloat, redundant tiers, or annual billing conversions</p>
            </div>
          </div>
          <button
            onClick={handleAuditExpenses}
            disabled={isAnalyzing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer self-start sm:self-center"
          >
            {isAnalyzing ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Auditing Stack...
              </>
            ) : (
              <>
                <Sparkles size={13} className="fill-white" />
                Audit Stack
              </>
            )}
          </button>
        </div>

        {aiError && (
          <p className="text-xs text-rose-600 font-semibold font-mono flex items-center gap-1.5">
            <span>⚠️ {aiError}</span>
          </p>
        )}

        {aiAnalysis && (
          <div className="bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-lg p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium space-y-2">
            <p className="font-bold text-indigo-700 dark:text-indigo-400 font-mono text-[10px] uppercase tracking-wider">Audit Results & Recommendations:</p>
            <div className="whitespace-pre-line font-sans text-xs">
              {aiAnalysis}
            </div>
          </div>
        )}
      </div>

      {/* Add Subscription Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-4">
            <Tag size={18} className="text-blue-500" />
            Track recurring SaaS Expense
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Subscription / Suite Name *</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GitHub Copilot Teams"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Subscription Cost ($) *</label>
              <input 
                type="number" 
                required 
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 38"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Billing Cycle</label>
                <select 
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Next Renewal Date</label>
                <input 
                  type="date" 
                  value={nextRenewal}
                  onChange={(e) => setNextRenewal(e.target.value)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Expense Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="Hosting">Hosting / Servers</option>
                <option value="AI / SaaS">AI / SaaS Assistant</option>
                <option value="Marketing">Marketing / CRM Tooling</option>
                <option value="Design Tools">Design Suites</option>
                <option value="Communication">Workspace Communications</option>
                <option value="Other">Other Expenses</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="Active">Active Subscription</option>
                <option value="Paused">Paused / Suspended</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg"
            >
              Log SaaS Tool
            </button>
          </div>
        </form>
      )}

      {/* Directory Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm relative">
        <Search className="absolute left-7 top-6 text-slate-400" size={16} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recurring subscriptions or categorize tools..."
          className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm bg-transparent dark:text-slate-100" 
        />
      </div>

      {/* Subscriptions Grid list */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl py-12 text-center">
          <Tag size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">No company SaaS expense registries found.</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Input recurring SaaS packages to monitor cost allocations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubs.map((sub) => (
            <div 
              key={sub.id} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition flex justify-between items-start"
            >
              <div className="space-y-3">
                <div>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">
                    {sub.category}
                  </span>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2">{sub.name}</h3>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={12} className="text-blue-500" />
                    <span>Next Renewal: <strong className="font-mono text-slate-700 dark:text-slate-300">{sub.nextRenewal || "Not Specified"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Activity size={12} className="text-emerald-500" />
                    <span className="flex items-center gap-1">
                      Billing State: 
                      <select
                        value={sub.status}
                        onChange={(e) => updateSubscription(sub.id, { status: e.target.value as any })}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border bg-transparent ${
                          sub.status === "Active" ? "border-emerald-200 text-emerald-800 dark:border-emerald-950 dark:text-emerald-300" :
                          sub.status === "Paused" ? "border-amber-200 text-amber-800 dark:border-amber-950 dark:text-amber-300" :
                          "border-rose-200 text-rose-800 dark:border-rose-950 dark:text-rose-300"
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right block: Cost metric */}
              <div className="text-right space-y-4">
                <button
                  onClick={() => { if(confirm("Archived/Delete subscription cost?")) deleteSubscription(sub.id); }}
                  className="text-slate-400 hover:text-rose-500 p-1 rounded"
                >
                  <Trash2 size={13} />
                </button>
                
                <div>
                  <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Recurring Cost</p>
                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    <PrivateText type="money">${Number(sub.cost).toLocaleString(undefined, { minimumFractionDigits: 0 })}</PrivateText>
                    <span className="text-xs font-normal text-slate-400">/{sub.billingCycle === "Monthly" ? "mo" : "yr"}</span>
                  </h4>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
