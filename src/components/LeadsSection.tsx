import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  Plus, 
  Search, 
  Trash2, 
  Mail, 
  Calendar, 
  Sparkles, 
  Check, 
  X, 
  ExternalLink,
  ChevronDown,
  Building,
  User,
  Phone,
  DollarSign,
  FileText
} from "lucide-react";

export const LeadsSection: React.FC = () => {
  const { 
    leads, 
    addLead, 
    updateLead, 
    deleteLead, 
    scheduleMeet,
    sendGmailMessage,
    isPrivacyMode
  } = useCRM();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Create Lead Form states
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<any>("New");
  const [source, setSource] = useState("Web Form");
  const [notes, setNotes] = useState("");
  const [expectedCloseMonth, setExpectedCloseMonth] = useState<"Current" | "Next">("Current");

  const getMonthNames = () => {
    const current = new Date();
    const next = new Date();
    next.setMonth(current.getMonth() + 1);
    
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
    return {
      current: formatter.format(current),
      next: formatter.format(next)
    };
  };

  const months = getMonthNames();

  // Meet Schedule Modal states
  const [schedulingLead, setSchedulingLead] = useState<any>(null);
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("");

  // AI Outbound Suggestion states
  const [aiDraftLead, setAiDraftLead] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDraftSubject, setAiDraftSubject] = useState("");
  const [aiDraftBody, setAiDraftBody] = useState("");
  const [aiError, setAiError] = useState("");

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    await addLead({
      name,
      email,
      phone,
      company,
      value: Number(value) || 0,
      status,
      source,
      notes,
      expectedCloseMonth
    });

    // Reset Form
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setValue("");
    setStatus("New");
    setSource("Web Form");
    setNotes("");
    setExpectedCloseMonth("Current");
    setIsAdding(false);
  };

  const handleScheduleMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingLead || !meetTitle || !meetDate || !meetTime) return;

    await scheduleMeet({
      title: meetTitle,
      contactName: schedulingLead.name,
      date: meetDate,
      time: meetTime
    });

    setMeetTitle("");
    setMeetDate("");
    setMeetTime("");
    setSchedulingLead(null);
  };

  // Generate Personalized Outbound Intro Email via Gemini
  const generateOutboundEmail = async (lead: any) => {
    setAiDraftLead(lead);
    setAiGenerating(true);
    setAiError("");
    setAiDraftSubject("");
    setAiDraftBody("");

    try {
      const prompt = `Write a professional, highly engaging outbound business proposal intro email to a potential client.
      Lead Details:
      - Name: ${lead.name}
      - Company: ${lead.company}
      - Estimated Project Value: $${lead.value}
      - Context/User Notes: ${lead.notes || "No special context provided. Keep it focused on generic business systems consulting."}

      Our Business Profile:
      - Name: Operations Hub (All In 1 Events / Consulting)
      - Host Email: operations@crmconsulting.com

      Please output JSON ONLY with two fields:
      "subject": A catchy yet professional email subject line.
      "body": The full body of the email (without place holders, write natural elegant text ready to send). Ensure it sounds human-written, highly bespoke, and operations-focused.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Try to parse JSON from response, fallback if Gemini output is plain text
      try {
        const text = data.text.trim();
        // Extract JSON if wrapped in markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        setAiDraftSubject(parsed.subject || `Partnership Proposal - Operations Hub`);
        setAiDraftBody(parsed.body || parsed.text || text);
      } catch (parseErr) {
        // Fallback for plain text response
        setAiDraftSubject(`Bespoke Consulting Partnership Proposal`);
        setAiDraftBody(data.text);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to generate AI proposal email draft.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSendDraft = async () => {
    if (!aiDraftLead || !aiDraftSubject || !aiDraftBody) return;

    await sendGmailMessage({
      from: "operations@crmconsulting.com",
      fromName: "Operations Hub Support",
      to: aiDraftLead.email,
      subject: aiDraftSubject,
      body: aiDraftBody,
      isDraft: false
    });

    // Mark lead as contacted
    await updateLead(aiDraftLead.id, { status: "Contacted" });

    setAiDraftLead(null);
    setAiDraftSubject("");
    setAiDraftBody("");
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || lead.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Leads & Sales Pipelines</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track prospects, value pipelines, and generate AI-driven proposals</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Add Prospect"}
        </button>
      </div>

      {/* Add Lead Panel */}
      {isAdding && (
        <form onSubmit={handleCreateLead} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-4">
            <User size={18} className="text-blue-500" />
            Add Prospect Lead Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Contact Name *</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Johnathan Miller"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Email *</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@cyberdyne.io"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 124-5892"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Company Name</label>
              <input 
                type="text" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Cyberdyne Systems"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Estimated Deal Value ($)</label>
              <input 
                type="number" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 12500"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Lead Funnel Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="New">New Prospect</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal / Bid</option>
                <option value="Won">Closed Won</option>
                <option value="Lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Acquisition Source</label>
              <select 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="Web Form">Inbound Web Form</option>
                <option value="Referral">Business Referral</option>
                <option value="Inbound Email">Direct Inbound Email</option>
                <option value="Cold Call">Cold Outreach</option>
                <option value="Social Media">LinkedIn / Twitter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Est. Close Month</label>
              <select 
                value={expectedCloseMonth}
                onChange={(e) => setExpectedCloseMonth(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-medium"
              >
                <option value="Current">Current ({months.current})</option>
                <option value="Next">Next ({months.next})</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Internal Notes & Context</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Details of conversations, exact operations needs..."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              />
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
              Save Prospect
            </button>
          </div>
        </form>
      )}

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by contact name, company, or email..."
            className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm bg-transparent dark:text-slate-100" 
          />
        </div>
        <div className="flex gap-2">
          {["All", "New", "Contacted", "Qualified", "Proposal", "Won", "Lost"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                filterStatus === s 
                  ? "bg-slate-950 text-white border-slate-950 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100" 
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Pipeline List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <User size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">No pipeline prospects found.</p>
            <p className="text-xs text-slate-400 mt-1">Try modifying your query or filters, or add a new prospect.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-5">Lead / Contact</th>
                  <th className="py-3 px-5">Company / Source</th>
                  <th className="py-3 px-5">Estimated Value</th>
                  <th className="py-3 px-5">Funnels Status</th>
                  <th className="py-3 px-5">Est. Close</th>
                  <th className="py-3 px-5">Internal Notes</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        <PrivateText type="name">{lead.name}</PrivateText>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        <PrivateText type="email">{lead.email}</PrivateText>
                      </div>
                      {lead.phone && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          <PrivateText type="phone">{lead.phone}</PrivateText>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                        <Building size={12} className="text-slate-400" />
                        <PrivateText>{lead.company || "N/A"}</PrivateText>
                      </div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-100">
                      <PrivateText type="money">
                        ${Number(lead.value).toLocaleString()}
                      </PrivateText>
                    </td>
                    <td className="py-4 px-5">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLead(lead.id, { status: e.target.value as any })}
                        className={`text-xs font-semibold px-2 py-1 rounded border bg-transparent ${
                          lead.status === "New" ? "border-sky-200 text-sky-800 dark:border-sky-900 dark:text-sky-300" :
                          lead.status === "Contacted" ? "border-amber-200 text-amber-800 dark:border-amber-900 dark:text-amber-300" :
                          lead.status === "Qualified" ? "border-purple-200 text-purple-800 dark:border-purple-900 dark:text-purple-300" :
                          lead.status === "Proposal" ? "border-blue-200 text-blue-800 dark:border-blue-900 dark:text-blue-300" :
                          lead.status === "Won" ? "border-emerald-200 text-emerald-800 dark:border-emerald-900 dark:text-emerald-300" :
                          "border-rose-200 text-rose-800 dark:border-rose-900 dark:text-rose-300"
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="py-4 px-5">
                      <select
                        value={lead.expectedCloseMonth || "Current"}
                        onChange={(e) => updateLead(lead.id, { expectedCloseMonth: e.target.value as any })}
                        className="text-xs font-semibold px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <option value="Current">{months.current}</option>
                        <option value="Next">{months.next}</option>
                      </select>
                    </td>
                    <td className="py-4 px-5 text-slate-400 text-xs max-w-xs truncate" title={lead.notes}>
                      <PrivateText>{lead.notes || "No notes logged."}</PrivateText>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex gap-2 justify-end">
                        {/* Gemini AI Action */}
                        <button
                          onClick={() => generateOutboundEmail(lead)}
                          title="Generate outbound proposal with Gemini AI"
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 hover:text-purple-700 transition"
                        >
                          <Sparkles size={16} />
                        </button>
                        
                        {/* Schedule Meet */}
                        <button
                          onClick={() => setSchedulingLead(lead)}
                          title="Schedule Google Meet"
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500 hover:text-blue-600 transition"
                        >
                          <Calendar size={16} />
                        </button>

                        {/* Trash */}
                        <button
                          onClick={() => { if (confirm("Delete this lead?")) deleteLead(lead.id); }}
                          title="Delete prospect"
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition"
                        >
                          <Trash2 size={16} />
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

      {/* Schedule Meeting Modal */}
      {schedulingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="text-blue-500" size={18} />
                Schedule Google Meet Invite
              </h3>
              <button onClick={() => setSchedulingLead(null)} className="text-slate-400 hover:text-slate-500">
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              Scheduling a Google Meet with <strong className="text-slate-700 dark:text-slate-300"><PrivateText type="name">{schedulingLead.name}</PrivateText></strong> from <strong className="text-slate-700 dark:text-slate-300"><PrivateText>{schedulingLead.company || "N/A"}</PrivateText></strong>.
            </p>

            <form onSubmit={handleScheduleMeet} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500">Meeting Topic / Title</label>
                <input 
                  type="text" 
                  required 
                  value={meetTitle} 
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder="e.g. Consulting Deliverables Review"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Date</label>
                  <input 
                    type="date" 
                    required 
                    value={meetDate} 
                    onChange={(e) => setMeetDate(e.target.value)}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Time</label>
                  <input 
                    type="time" 
                    required 
                    value={meetTime} 
                    onChange={(e) => setMeetTime(e.target.value)}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-4">
                <button 
                  type="button" 
                  onClick={() => setSchedulingLead(null)}
                  className="px-3 py-1.5 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-1.5 rounded-lg"
                >
                  Create Meet Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Draft Proposal Modal */}
      {aiDraftLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="text-purple-500 animate-pulse" size={18} />
                Gemini AI Outbound Email Proposal
              </h3>
              <button onClick={() => setAiDraftLead(null)} className="text-slate-400 hover:text-slate-500">
                <X size={16} />
              </button>
            </div>

            {aiGenerating ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Gemini is synthesizing proposal context...</p>
                <p className="text-[10px] text-slate-400">Analyzing company profile and notes for lead: {aiDraftLead.name}</p>
              </div>
            ) : aiError ? (
              <div className="bg-rose-50 text-rose-800 dark:bg-rose-950/25 dark:text-rose-300 p-4 rounded-lg text-sm">
                <p className="font-semibold">Generation Error</p>
                <p className="text-xs mt-1">{aiError}</p>
                <button 
                  onClick={() => generateOutboundEmail(aiDraftLead)}
                  className="mt-3 text-xs bg-rose-600 text-white font-medium px-3 py-1.5 rounded hover:bg-rose-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Synthesized a hyper-personalized consulting outreach proposal based on notes. Review, adjust, and deploy directly into the client's Inbox queue.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Subject</label>
                    <input 
                      type="text" 
                      value={aiDraftSubject}
                      onChange={(e) => setAiDraftSubject(e.target.value)}
                      className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Email Body</label>
                    <textarea 
                      value={aiDraftBody}
                      onChange={(e) => setAiDraftBody(e.target.value)}
                      rows={12}
                      className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="text-[11px] text-slate-400 font-mono">Recipient: <PrivateText type="email">{aiDraftLead.email}</PrivateText></span>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setAiDraftLead(null)}
                      className="px-3 py-1.5 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSendDraft}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      <Mail size={12} />
                      Send via Gmail
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
