import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Target, 
  DollarSign,
  Activity,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  Printer,
  Percent,
  ArrowDownRight,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  TrendingDown,
  Lock,
  Unlock
} from "lucide-react";

export const DashboardAnalytics: React.FC = () => {
  const { 
    leads, 
    invoices, 
    projects, 
    subscriptions,
    financialTransactions = [],
    addFinancialTransaction,
    deleteFinancialTransaction,
    isPrivacyMode
  } = useCRM();

  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // --- EXISTING CHART MATH ---
  const invoiceStatuses = {
    Paid: invoices.filter(i => i.status === "Paid").length,
    Sent: invoices.filter(i => i.status === "Sent").length,
    Draft: invoices.filter(i => i.status === "Draft").length,
    Overdue: invoices.filter(i => i.status === "Overdue").length,
  };

  const totalInvoices = invoices.length || 1;

  // Monthly income vs spend simulation over last 5 months
  const monthlyRevenue = [
    { month: "Jan", revenue: 4500, spend: 1200 },
    { month: "Feb", revenue: 5800, spend: 1350 },
    { month: "Mar", revenue: 8200, spend: 1400 },
    { month: "Apr", revenue: 9500, spend: 1550 },
    { month: "May", revenue: 12400, spend: 1800 }
  ];

  // Dynamically include actual current database numbers in the final month data point
  const actualPaid = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const actualSpend = subscriptions.filter(s => s.status === "Active").reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  
  if (actualPaid > 0) {
    monthlyRevenue.push({ month: "Current", revenue: actualPaid, spend: actualSpend });
  }

  // Max value for scaling SVG line chart
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 10000);
  const chartHeight = 140;
  const chartWidth = 480;

  // Coordinates for Revenue Polyline
  const pointsRevenue = monthlyRevenue.map((m, i) => {
    const x = (i / (monthlyRevenue.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((m.revenue / maxRevenue) * (chartHeight - 30)) - 10;
    return `${x},${y}`;
  }).join(" ");

  // Coordinates for Expense Polyline
  const pointsSpend = monthlyRevenue.map((m, i) => {
    const x = (i / (monthlyRevenue.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((m.spend / maxRevenue) * (chartHeight - 30)) - 10;
    return `${x},${y}`;
  }).join(" ");

  // Filled Area Points
  const areaRevenue = `${pointsRevenue} ${((monthlyRevenue.length - 1) / (monthlyRevenue.length - 1)) * (chartWidth - 40) + 20},${chartHeight} 20,${chartHeight}`;


  // --- PROFIT & LOSS LEDGER ENGINE ---
  const [pAndLType, setPAndLType] = useState<"Monthly" | "Yearly">("Monthly");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Manual ledger entry state
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [txType, setTxType] = useState<"Income" | "Expense">("Expense");
  const [txCategory, setTxCategory] = useState("Marketing");
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));

  // Helper to extract year and month safely
  const getYearAndMonth = (dateStr: string | undefined): { year: number, month: number } => {
    if (!dateStr) return { year: new Date().getFullYear(), month: new Date().getMonth() };
    const cleanStr = dateStr.substring(0, 10);
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) {
      const parts = cleanStr.split("-");
      if (parts.length >= 2) {
        return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1 };
      }
      return { year: new Date().getFullYear(), month: new Date().getMonth() };
    }
    return { year: d.getFullYear(), month: d.getMonth() };
  };

  // Filter items
  const filterPaidInvoices = invoices.filter(inv => {
    if (inv.status !== "Paid") return false;
    const { year, month } = getYearAndMonth(inv.dueDate || inv.createdAt);
    if (year !== selectedYear) return false;
    if (pAndLType === "Monthly" && month !== selectedMonth) return false;
    return true;
  });

  const filterAuxIncome = (financialTransactions || []).filter(tx => {
    if (tx.type !== "Income") return false;
    const { year, month } = getYearAndMonth(tx.date);
    if (year !== selectedYear) return false;
    if (pAndLType === "Monthly" && month !== selectedMonth) return false;
    return true;
  });

  const filterDiscretionaryExpenses = (financialTransactions || []).filter(tx => {
    if (tx.type !== "Expense") return false;
    const { year, month } = getYearAndMonth(tx.date);
    if (year !== selectedYear) return false;
    if (pAndLType === "Monthly" && month !== selectedMonth) return false;
    return true;
  });

  // Calculate SaaS subscriptions expense prorated
  const activeSubs = subscriptions.filter(s => s.status === "Active");
  const calculatedSubExpenses = activeSubs.map(s => {
    const cost = Number(s.cost) || 0;
    let proratedCost = 0;
    if (pAndLType === "Monthly") {
      if (s.billingCycle === "Monthly") proratedCost = cost;
      else if (s.billingCycle === "Annual") proratedCost = cost / 12;
      else if (s.billingCycle === "Weekly") proratedCost = cost * 4.33;
      else proratedCost = cost;
    } else { // Yearly
      if (s.billingCycle === "Monthly") proratedCost = cost * 12;
      else if (s.billingCycle === "Annual") proratedCost = cost;
      else if (s.billingCycle === "Weekly") proratedCost = cost * 52;
      else proratedCost = cost * 12;
    }
    return { ...s, proratedCost };
  });

  // Totals calculations
  const totalInvoiceRev = filterPaidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalAuxRev = filterAuxIncome.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalRevenue = totalInvoiceRev + totalAuxRev;

  const totalSubExp = calculatedSubExpenses.reduce((sum, s) => sum + s.proratedCost, 0);
  const totalOtherExp = filterDiscretionaryExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalExpenses = totalSubExp + totalOtherExp;

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid positive transaction amount.");
      return;
    }
    try {
      await addFinancialTransaction({
        type: txType,
        category: txCategory,
        amount: amountNum,
        description: txDescription || `${txType} entry for ${txCategory}`,
        date: txDate
      });
      // reset form
      setTxAmount("");
      setTxDescription("");
      setIsAddingTx(false);
    } catch (err) {
      console.error("Error saving ledger transaction", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Dynamic SVG Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Cashflow Analytics & Projections Line Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-emerald-500" />
                Cashflow & Revenue Progression
              </h3>
              <p className="text-[11px] text-slate-400">Comparing real-time cumulative invoices income vs. software spend</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block"></span>
                <span className="text-slate-500">Sales Invoiced</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                <span className="text-slate-500">SaaS Spend</span>
              </span>
            </div>
          </div>

          {/* Responsive SVG Chart Container */}
          <div className="relative w-full overflow-hidden mt-6">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2={chartWidth - 20} y2="20" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="1" />
              <line x1="20" y1="60" x2={chartWidth - 20} y2="60" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="1" />
              <line x1="20" y1="100" x2={chartWidth - 20} y2="100" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="1" />
              <line x1="20" y1={chartHeight} x2={chartWidth - 20} y2={chartHeight} stroke="#cbd5e1" className="dark:stroke-slate-700" strokeWidth="1.5" />

              {/* Filled area for Revenue */}
              <polygon points={areaRevenue} fill="url(#revenue-grad)" opacity="0.08" />

              {/* Expense Polyline */}
              <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4 4" points={pointsSpend} />

              {/* Revenue Polyline */}
              <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={pointsRevenue} />

              {/* Interactive Data Dots */}
              {monthlyRevenue.map((m, i) => {
                const x = (i / (monthlyRevenue.length - 1)) * (chartWidth - 40) + 20;
                const yRev = chartHeight - ((m.revenue / maxRevenue) * (chartHeight - 30)) - 10;
                const ySpend = chartHeight - ((m.spend / maxRevenue) * (chartHeight - 30)) - 10;

                return (
                  <g key={i}>
                    {/* Revenue Dot */}
                    <circle cx={x} cy={yRev} r="4.5" className="fill-blue-600 stroke-white dark:stroke-slate-900" strokeWidth="1.5" />
                    {/* Spend Dot */}
                    <circle cx={x} cy={ySpend} r="4" className="fill-rose-500 stroke-white dark:stroke-slate-900" strokeWidth="1.5" />
                    
                    {/* X Axis Month Labels */}
                    <text x={x} y={chartHeight + 15} textAnchor="middle" className="fill-slate-400 font-mono text-[9px] font-bold">
                      {m.month}
                    </text>
                  </g>
                );
              })}

              {/* Defs for gradients */}
              <defs>
                <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Dynamic Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-medium">Pipeline Target</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">$25,000</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium">Invoice Paid Ratio</span>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">
                {Math.round((invoiceStatuses.Paid / totalInvoices) * 100)}%
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium">Burn Rate Indicator</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">Low Expense</p>
            </div>
          </div>
        </div>

        {/* 2. Invoices Status Allocation Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <PieChart size={16} className="text-purple-500" />
                Invoice Status Allocation
              </h3>
              <span className="text-[10px] font-mono text-slate-400">N={invoices.length}</span>
            </div>

            {/* Simple Donut Simulation using Tailwind */}
            <div className="flex items-center justify-center py-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[10px] border-slate-100 dark:border-slate-800"></div>
                <div className="absolute inset-2 rounded-full border-[8px] border-dashed border-blue-500/30"></div>
                
                <div className="text-center z-10">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Paid / Total</span>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {invoiceStatuses.Paid}/{invoices.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Keys */}
          <div className="space-y-2 mt-4 text-[11px] font-medium text-slate-500">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/60 pb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                <span>Paid Invoices</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{invoiceStatuses.Paid}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/60 pb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block"></span>
                <span>Sent (Awaiting Payment)</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{invoiceStatuses.Sent}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/60 pb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                <span>Draft Documents</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{invoiceStatuses.Draft}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
                <span>Overdue / Defaulter</span>
              </span>
              <span className="font-bold text-red-500">{invoiceStatuses.Overdue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- BRAND NEW INTERACTIVE P&L REPORT SHEET BLOCK --- */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-850 dark:border-slate-800 rounded-3xl p-6 shadow-md relative overflow-hidden" id="pl-ledger-card">
        
        {/* Aesthetic design element */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-500" size={20} />
              <h2 className="font-black text-lg text-slate-900 dark:text-slate-50">Profit & Loss Statement (P&L)</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time statement generated from cleared invoice assets, SaaS spend, and discretionary bookkeeping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Toggle Report Scale */}
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <button
                onClick={() => setPAndLType("Monthly")}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition ${pAndLType === "Monthly" ? "bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-50" : "text-slate-500 hover:text-slate-800"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPAndLType("Yearly")}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition ${pAndLType === "Yearly" ? "bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-50" : "text-slate-500 hover:text-slate-800"}`}
              >
                Yearly
              </button>
            </div>

            {/* Selector dropdown for Year */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-750 text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer text-slate-800 dark:text-slate-200"
            >
              {[2026, 2025, 2024].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Selector dropdown for Month */}
            {pAndLType === "Monthly" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-750 text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer text-slate-800 dark:text-slate-200"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </select>
            )}

            {/* Print Ledger entry Button */}
            <button
              onClick={handlePrint}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-slate-750 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Print Ledger Report"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            {/* Create manual ledger entry */}
            <button
              onClick={() => setIsAddingTx(!isAddingTx)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto md:ml-0"
            >
              <Plus size={13} />
              <span>Add Transaction Entry</span>
            </button>
          </div>
        </div>

        {/* Manual ledger entry form overlay inline */}
        {isAddingTx && (
          <div className="mb-6 mt-4 p-4 bg-slate-50 dark:bg-slate-950/40 border-2 border-dashed border-emerald-500/30 rounded-2xl animate-in fade-in duration-200">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1">
              <Activity size={12} />
              New Bookkeeping Record
            </h3>
            
            <form onSubmit={handleAddTransactionSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-mono">Entry Type</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => { setTxType("Expense"); setTxCategory("Marketing"); }}
                    className={`flex-1 text-center text-[10px] font-bold py-1 rounded cursor-pointer ${txType === "Expense" ? "bg-rose-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Expense (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTxType("Income"); setTxCategory("Consulting Fee"); }}
                    className={`flex-1 text-center text-[10px] font-bold py-1 rounded cursor-pointer ${txType === "Income" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Income (+)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-mono">Category</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-200"
                >
                  {txType === "Income" ? (
                    <>
                      <option value="Consulting Fee">Consulting Fee</option>
                      <option value="Merchant Setup Commission">Merchant Setup Commission</option>
                      <option value="Referral Bonus">Referral Bonus</option>
                      <option value="Setup Fee">Setup Fee</option>
                      <option value="Event Booking">Event Booking</option>
                      <option value="Other Income">Other Income</option>
                    </>
                  ) : (
                    <>
                      <option value="Marketing">Marketing & Ads</option>
                      <option value="Payroll & Contractors">Payroll & Contractors</option>
                      <option value="SaaS Software Licensing">SaaS Software Licensing</option>
                      <option value="Travel & Office">Travel & Office</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Referral Commission Outflow">Referral Commission Outflow</option>
                      <option value="Other Expense">Other Expense</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-mono">Amount ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 250"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs rounded-lg p-2 font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-mono">Date</label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs rounded-lg p-2 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-mono">Description / Notes</label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="e.g. Google Ads Campaign"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>
              
              <div className="md:col-span-5 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTx(false)}
                  className="border border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-350 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Commit Entry
                </button>
              </div>
            </form>
          </div>
        )}

        {/* P&L Statement Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-5">
          
          {/* LEFT: P&L LEDGER DOCUMENT SHEET (Spans 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850 p-6 font-mono text-xs text-slate-700 dark:text-slate-350 shadow-inner">
              
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-300 dark:border-slate-700 pb-4 mb-5">
                <p className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-slate-50 font-sans">
                  FRESH START CREDIT SERVICES & ASSOCIATES
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Statement of Profit and Loss (Ledger Account)
                </p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1.5 bg-emerald-50 dark:bg-emerald-950/20 inline-block px-3 py-0.5 rounded-full font-mono border border-emerald-100 dark:border-emerald-950">
                  Period: {pAndLType === "Monthly" ? `${monthNames[selectedMonth]} ${selectedYear}` : `${selectedYear} Fiscal Year`}
                </p>
              </div>

              {/* SECTION I: REVENUE */}
              <div className="space-y-2">
                <div className="flex justify-between font-black text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                  <span>I. OPERATING REVENUE</span>
                  <span>CREDIT (Inflow)</span>
                </div>
                
                {/* 1. Invoices Paid */}
                <div className="pl-4 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>A. Customer Invoice Clearances</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ${totalInvoiceRev.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {/* Paid Invoices List */}
                  {filterPaidInvoices.length > 0 ? (
                    <div className="pl-4 border-l border-slate-200 dark:border-slate-850 space-y-1 text-[10px] text-slate-400">
                      {filterPaidInvoices.map((inv) => (
                        <div key={inv.id} className="flex justify-between">
                          <span>- #{inv.invoiceNumber} {inv.contactName}</span>
                          <span>
                            <PrivateText type="value">${(Number(inv.amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivateText>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pl-4 text-[10px] text-slate-400 italic font-mono">- No invoice assets cleared in this period.</p>
                  )}
                </div>

                {/* 2. Auxiliary Income */}
                <div className="pl-4 space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>B. Discretionary Business Inflows</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ${totalAuxRev.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Auxiliary list */}
                  {filterAuxIncome.length > 0 ? (
                    <div className="pl-4 border-l border-slate-200 dark:border-slate-850 space-y-1 text-[10px] text-slate-400">
                      {filterAuxIncome.map((tx) => (
                        <div key={tx.id} className="flex justify-between group">
                          <span className="flex items-center gap-1">
                            - {tx.category}: {tx.description}
                            <button
                              onClick={() => { if(confirm("Remove this entry from ledger?")) deleteFinancialTransaction(tx.id); }}
                              className="text-slate-300 hover:text-rose-500 transition cursor-pointer hidden group-hover:inline ml-1"
                              title="Delete Transaction Record"
                            >
                              <Trash2 size={9} />
                            </button>
                          </span>
                          <span>
                            <PrivateText type="value">${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivateText>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pl-4 text-[10px] text-slate-400 italic font-mono">- No additional cash inflows recorded.</p>
                  )}
                </div>

                {/* Total Operating Revenue */}
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 bg-emerald-500/5 dark:bg-emerald-950/20 p-2 rounded-lg mt-3 border border-emerald-100/30 dark:border-emerald-900/30">
                  <span className="font-sans">TOTAL GROSS OPERATING REVENUE (A + B)</span>
                  <span className="underline decoration-double">
                    <PrivateText type="value">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivateText>
                  </span>
                </div>
              </div>

              {/* SECTION II: OPERATING EXPENSES */}
              <div className="space-y-2 pt-6">
                <div className="flex justify-between font-black text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 font-sans">
                  <span>II. OPERATING EXPENSES</span>
                  <span>DEBIT (Outflow)</span>
                </div>

                {/* 1. SaaS Subscriptions */}
                <div className="pl-4 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>A. SaaS Software & Subscriptions (Prorated)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ${totalSubExp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Subscriptions List */}
                  {calculatedSubExpenses.length > 0 ? (
                    <div className="pl-4 border-l border-slate-200 dark:border-slate-850 space-y-1 text-[10px] text-slate-400">
                      {calculatedSubExpenses.map((sub) => (
                        <div key={sub.id} className="flex justify-between">
                          <span>- {sub.name} (Billing Cycle: {sub.billingCycle})</span>
                          <span>
                            <PrivateText type="value">${sub.proratedCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivateText>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pl-4 text-[10px] text-slate-400 italic font-mono">- No software tools or active SaaS subscriptions logged.</p>
                  )}
                </div>

                {/* 2. Discretionary / Other expenses */}
                <div className="pl-4 space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>B. Discretionary Operational Costs</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ${totalOtherExp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Discretionary List */}
                  {filterDiscretionaryExpenses.length > 0 ? (
                    <div className="pl-4 border-l border-slate-200 dark:border-slate-850 space-y-1 text-[10px] text-slate-400">
                      {filterDiscretionaryExpenses.map((tx) => (
                        <div key={tx.id} className="flex justify-between group">
                          <span className="flex items-center gap-1">
                            - {tx.category}: {tx.description}
                            <button
                              onClick={() => { if(confirm("Remove this entry from ledger?")) deleteFinancialTransaction(tx.id); }}
                              className="text-slate-300 hover:text-rose-500 transition cursor-pointer hidden group-hover:inline ml-1"
                              title="Delete Transaction Record"
                            >
                              <Trash2 size={9} />
                            </button>
                          </span>
                          <span>
                            <PrivateText type="value">${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivateText>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pl-4 text-[10px] text-slate-400 italic font-mono">- No manual ledger cost entries logged.</p>
                  )}
                </div>

                {/* Total expenses */}
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 bg-rose-500/5 dark:bg-rose-950/20 p-2 rounded-lg mt-3 border border-rose-100/30 dark:border-rose-900/30">
                  <span className="font-sans">TOTAL OPERATING DEBITS (A + B)</span>
                  <span className="underline decoration-solid">
                    <PrivateText type="value">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivateText>
                  </span>
                </div>
              </div>

              {/* NET SUMMARY LINE */}
              <div className="border-t-2 border-slate-300 dark:border-slate-700 mt-6 pt-4 space-y-3">
                <div className="flex justify-between font-black text-slate-900 dark:text-slate-50 text-sm bg-slate-150 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-sans">
                  <span>III. NET OPERATING PROFIT / (LOSS)</span>
                  <span className={`${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} underline decoration-double`}>
                    <PrivateText type="value">
                      {netProfit >= 0 ? "" : "-"}${Math.abs(netProfit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </PrivateText>
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1 font-sans">
                  <span>SYSTEM AUDIT SIGNATURE: FRESH_START_LEDGER_AUTO_V2</span>
                  <span>CONFIDENTIAL ACCOUNTANT LEDGER COPY</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: BUSINESS HEALTH & MARGIN INDICATORS (Spans 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* P&L Health Card */}
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4 shadow-xs">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Percent size={14} className="text-emerald-500" />
                Ledger Margins & Metrics
              </h4>
              
              <div className="space-y-4">
                {/* Profit Margin Gauge */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Operating Margin</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                      {profitMargin.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Net Profit Ratio</span>
                  </div>
                  
                  {/* Custom Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Net Income Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Cumulative EBITDA</span>
                    <p className={`text-xl font-black mt-1 ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                      <PrivateText type="value">
                        {netProfit >= 0 ? "+" : "-"}${Math.abs(netProfit).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </PrivateText>
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"} dark:bg-slate-800/60`}>
                    {netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                </div>

                {/* Audit and sync status */}
                <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Sparkles className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" size={14} />
                    <div className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                      <strong>Automatic Sync Active</strong>: All invoice reconciliations from client profiles auto-publish cleared revenue here instantaneously!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick ledger summary advisory */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3.5">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider font-sans">
                Operating Quick Guidelines
              </h4>
              <ul className="text-[11px] text-slate-500 space-y-2 list-disc pl-4 font-medium">
                <li>Toggle <strong>Monthly</strong> scale to review payroll or marketing spend cycles.</li>
                <li>Toggle <strong>Yearly</strong> scale for corporate tax planning & EBITDA forecasting.</li>
                <li>Invoice records marked <strong>Paid</strong> are added automatically. No manual recording required.</li>
                <li>Press the <strong>Print</strong> button to export full sheets directly to your client or tax professional.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
