import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  Plus, 
  Trash2, 
  FileText, 
  X, 
  Search, 
  CheckCircle, 
  DollarSign,
  PlusCircle,
  FileMinus,
  Eye,
  Printer,
  Download,
  Sparkles,
  AlertCircle
} from "lucide-react";

export const InvoicesSection: React.FC = () => {
  const { 
    invoices, 
    contacts, 
    addInvoice, 
    updateInvoice, 
    deleteInvoice 
  } = useCRM();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);

  // AI Invoice Reminder states
  const [aiReminderText, setAiReminderText] = useState("");
  const [isDraftingReminder, setIsDraftingReminder] = useState(false);
  const [aiReminderError, setAiReminderError] = useState("");
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const handleGenerateReminder = async (invoiceToUse: any) => {
    if (!invoiceToUse) return;
    setIsDraftingReminder(true);
    setAiReminderError("");
    setAiReminderText("");
    setIsReminderOpen(true);

    try {
      const prompt = `Write an elegant, highly professional payment reminder email to a client regarding an invoice.
      Invoice Details:
      - Invoice Number: ${invoiceToUse.invoiceNumber}
      - Client Name: ${invoiceToUse.contactName}
      - Amount Due: $${Number(invoiceToUse.amount).toLocaleString()}
      - Due Date: ${invoiceToUse.dueDate || "Immediate receipt"}
      - Status: ${invoiceToUse.status}

      Our Agency Profile:
      - Name: All In 1 Events & Operations Consultancy
      - Contact Email: operations@crmconsulting.com

      Tone parameter: "polite, structured, firm but friendly executive reminder". Ensure it is written professionally as a final ready-to-copy email template text. Include a clear subject line and email body. Do not output code blocks.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiReminderText(data.text);
    } catch (err: any) {
      console.error(err);
      setAiReminderError(err.message || "Failed to generate AI payment reminder.");
    } finally {
      setIsDraftingReminder(false);
    }
  };

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [contactName, setContactName] = useState("");
  const [status, setStatus] = useState<any>("Sent");
  const [dueDate, setDueDate] = useState("");
  
  // Custom Line Items state
  const [items, setItems] = useState<any[]>([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const handleAddItemRow = () => {
    setItems([...items, { id: String(Date.now()), description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleRemoveItemRow = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, val: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: val };
        // Recalculate item level amount
        const qty = Number(updatedItem.quantity) || 0;
        const rate = Number(updatedItem.rate) || 0;
        updatedItem.amount = qty * rate;
        return updatedItem;
      }
      return item;
    });
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || items.length === 0) return;

    // Filter empty items
    const validItems = items.filter(i => i.description.trim() !== "");
    if (validItems.length === 0) return;

    const totalAmount = validItems.reduce((sum, item) => sum + item.amount, 0);

    await addInvoice({
      invoiceNumber,
      contactName,
      status,
      dueDate,
      amount: totalAmount,
      items: validItems
    });

    // Reset Form
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setContactName("");
    setStatus("Sent");
    setDueDate("");
    setItems([{ id: "1", description: "", quantity: 1, rate: 0, amount: 0 }]);
    setIsAdding(false);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.contactName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate invoice level totals
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = invoices.filter(i => ["Sent", "Overdue"].includes(i.status)).reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Financial Invoicing</h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate corporate invoices, specify billing, and track payments</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Create Invoice"}
        </button>
      </div>

      {/* KPI totals for Invoice Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Billed</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            <PrivateText type="money">${totalInvoiced.toLocaleString()}</PrivateText>
          </p>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/35 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-emerald-600">Collected Income</p>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
            <PrivateText type="money">${totalPaid.toLocaleString()}</PrivateText>
          </p>
        </div>
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/35 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-amber-600">Outstanding Receivables</p>
          <p className="text-lg font-bold text-amber-800 dark:text-amber-300 mt-0.5">
            <PrivateText type="money">${totalOutstanding.toLocaleString()}</PrivateText>
          </p>
        </div>
      </div>

      {/* Add Invoice Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-4">
            <FileText size={18} className="text-blue-500" />
            Generate Corporate Invoice
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Invoice Number *</label>
              <input 
                type="text" 
                required 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Client Recipient *</label>
              <select 
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="">Select a Client Contact</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.name}>{c.name} ({c.company})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Payment Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Due Date</label>
                <input 
                  type="date" 
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                />
              </div>
            </div>
            
            {/* Invoice Line Items */}
            <div className="md:col-span-3 space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase flex justify-between">
                <span>Invoiced Deliverables / Items</span>
                <button 
                  type="button" 
                  onClick={handleAddItemRow}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 font-medium lowercase"
                >
                  + add line item
                </button>
              </label>

              <div className="space-y-2 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                {items.map((item, index) => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Item/Service Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs dark:text-slate-100"
                    />
                    <div className="flex gap-2 w-full md:w-auto">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs dark:text-slate-100 text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate ($)"
                        value={item.rate}
                        onChange={(e) => handleItemChange(item.id, "rate", Number(e.target.value))}
                        className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs dark:text-slate-100"
                      />
                      <div className="w-24 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center pl-2">
                        ${item.amount.toLocaleString()}
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 shrink-0"
                        >
                          <FileMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice registries by number or contact name..."
            className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm bg-transparent dark:text-slate-100" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto shrink-0">
          {["All", "Draft", "Sent", "Paid", "Overdue"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                filterStatus === st 
                  ? "bg-slate-950 text-white border-slate-950 dark:bg-slate-100 dark:text-slate-900" 
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">No invoice logs registered.</p>
            <p className="text-xs text-slate-400 mt-1">Specify custom deliverables and invoice corporate accounts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-5">Invoice Code</th>
                  <th className="py-3 px-5">Billed Recipient</th>
                  <th className="py-3 px-5">Billing Status</th>
                  <th className="py-3 px-5">Target Due Date</th>
                  <th className="py-3 px-5">Total Amount</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition">
                    <td className="py-4 px-5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        <PrivateText type="name">{inv.contactName}</PrivateText>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvoice(inv.id, { status: e.target.value as any })}
                        className={`text-xs font-semibold px-2 py-1 rounded border bg-transparent ${
                          inv.status === "Draft" ? "border-slate-200 text-slate-500 dark:border-slate-800" :
                          inv.status === "Sent" ? "border-blue-200 text-blue-800 dark:border-blue-900 dark:text-blue-300" :
                          inv.status === "Paid" ? "border-emerald-200 text-emerald-800 dark:border-emerald-900 dark:text-emerald-300" :
                          "border-rose-200 text-rose-800 dark:border-rose-900 dark:text-rose-300"
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="py-4 px-5 text-slate-500 text-xs font-mono">
                      {inv.dueDate || "N/A"}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-100">
                      <PrivateText type="money">${Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</PrivateText>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(inv)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 transition"
                          title="PDF Preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { if(confirm("Permanently void / delete invoice?")) deleteInvoice(inv.id); }}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                          title="Delete Invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice PDF Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="invoice-pdf-preview-modal">
          <div className="bg-white text-black border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden flex flex-col my-8">
            
            {/* Modal Controls Bar - Hidden in Print */}
            <div className="bg-[#F4F1EA] border-b-2 border-black p-4 flex justify-between items-center shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-black text-white text-[9px] font-mono uppercase tracking-widest font-extrabold">PDF Generator</span>
                <span className="text-xs font-mono font-bold text-slate-700">{previewInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateReminder(previewInvoice)}
                  className="bg-amber-500 text-white hover:bg-amber-600 font-mono text-xs font-extrabold uppercase py-1.5 px-3 border border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  <Sparkles size={13} className="fill-current animate-pulse" />
                  AI Reminder
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-black text-white hover:bg-neutral-800 font-mono text-xs font-extrabold uppercase py-1.5 px-3 border border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  <Printer size={13} />
                  Print PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewInvoice(null);
                    setIsReminderOpen(false);
                    setAiReminderText("");
                  }}
                  className="bg-white text-black hover:bg-[#eae6db] font-mono text-xs font-extrabold uppercase py-1.5 px-3 border border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  <X size={13} />
                  Close
                </button>
              </div>
            </div>

            {/* AI Reminder panel - Hidden in Print */}
            {isReminderOpen && (
              <div className="bg-amber-50 border-b-2 border-black p-4 space-y-2 text-xs print:hidden">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                    Gemini synthesized Payment Reminder Draft:
                  </span>
                  <button 
                    onClick={() => { setIsReminderOpen(false); setAiReminderText(""); }}
                    className="text-slate-400 hover:text-slate-600 font-bold font-mono cursor-pointer"
                  >
                    CLOSE [X]
                  </button>
                </div>

                {isDraftingReminder ? (
                  <div className="flex items-center gap-2 py-2">
                    <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-amber-700 font-medium">Synthesizing payment notification...</span>
                  </div>
                ) : aiReminderError ? (
                  <p className="text-rose-600 font-semibold">{aiReminderError}</p>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      readOnly
                      value={aiReminderText}
                      rows={5}
                      className="w-full bg-white border border-slate-300 p-2 font-mono text-[11px] text-slate-800 rounded focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiReminderText);
                          alert("Reminder email copied to clipboard.");
                        }}
                        className="bg-black text-white hover:bg-neutral-800 font-mono text-[10px] font-extrabold uppercase py-1 px-2 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Printable Area */}
            <div className="p-8 space-y-8 bg-white text-black font-sans leading-relaxed flex-1 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible" id="printable-invoice-sheet">
              
              {/* Invoice Sheet Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-black pb-6">
                <div>
                  <h1 className="text-xl font-serif font-black uppercase tracking-wider text-black">ALL-IN-ONE EVENTS CRM</h1>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Operations & Technical Consultancy</p>
                  <p className="text-[10px] font-mono text-slate-500">operations@crmconsulting.com</p>
                </div>
                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block p-1 bg-black text-white text-[10px] font-mono uppercase tracking-widest font-extrabold">INVOICE</div>
                  <p className="font-mono text-xs font-bold text-black mt-1">Code: {previewInvoice.invoiceNumber}</p>
                  <p className="text-[10px] font-mono text-slate-500">Issued: {new Date(previewInvoice.createdAt || Date.now()).toLocaleDateString()}</p>
                  <p className="text-[10px] font-mono text-red-600 font-bold">Due Date: {previewInvoice.dueDate || "Upon Receipt"}</p>
                </div>
              </div>

              {/* Invoice Party Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="p-4 border border-black/10 bg-slate-50/50">
                  <h3 className="font-mono font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-2">Billed To / Recipient</h3>
                  <p className="font-serif italic font-bold text-sm text-black">{previewInvoice.contactName}</p>
                  <p className="text-[10px] text-slate-600 mt-1">Customer Account Partner</p>
                  <p className="text-[10px] text-slate-500">Linked CRM contact profile</p>
                </div>
                <div className="p-4 border border-black/10 bg-slate-50/50">
                  <h3 className="font-mono font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-2">Payment Terms</h3>
                  <p className="font-mono text-[10px] text-slate-800">Status: <span className="font-bold underline uppercase">{previewInvoice.status}</span></p>
                  <p className="text-[10px] text-slate-500 mt-1">Terms: Net-30 Operational</p>
                  <p className="text-[10px] text-slate-500">Currency: USD ($)</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-black overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white text-[9px] font-mono uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-bold">Deliverable Item Description</th>
                      <th className="py-2.5 px-4 font-bold text-center w-16">Qty</th>
                      <th className="py-2.5 px-4 font-bold text-right w-24">Unit Rate</th>
                      <th className="py-2.5 px-4 font-bold text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 text-xs">
                    {previewInvoice.items && previewInvoice.items.length > 0 ? (
                      previewInvoice.items.map((item: any, i: number) => (
                        <tr key={item.id || i} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium">{item.description}</td>
                          <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono">${(Number(item.rate) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">${(Number(item.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-medium">Standard Consultancy / Integration service bundle</td>
                        <td className="py-3 px-4 text-center font-mono">1</td>
                        <td className="py-3 px-4 text-right font-mono">${Number(previewInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">${Number(previewInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-1.5 border-t border-black pt-3">
                  <div className="flex justify-between font-mono text-[11px] text-slate-500">
                    <span>Subtotal:</span>
                    <span>${Number(previewInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px] text-slate-500">
                    <span>Estimated Tax (8.25%):</span>
                    <span>${(Number(previewInvoice.amount) * 0.0825).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs font-black text-black border-t border-dashed border-black/20 pt-1.5">
                    <span>Grand Total Due:</span>
                    <span>${(Number(previewInvoice.amount) * 1.0825).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Footer Policy Notes */}
              <div className="border-t-2 border-black/10 pt-6 text-[10px] text-slate-400 font-mono leading-relaxed text-center">
                <p className="font-bold text-slate-700">Thank you for selecting ALL-IN-ONE EVENTS CRM.</p>
                <p className="mt-1">All electronic payments are synced with client tracking records automatically. If you have any inquiries regarding this document, please reply to our Operations Desk at operations@crmconsulting.com</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
