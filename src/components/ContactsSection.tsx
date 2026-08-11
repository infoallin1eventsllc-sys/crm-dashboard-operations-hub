import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { Contact } from "../types";
import { ClientProfileHubModal } from "./ClientProfileHubModal";
import { 
  Plus, 
  Search, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  User, 
  Briefcase,
  X,
  FileText,
  Sparkles,
  AlertCircle,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Check,
  FileSpreadsheet,
  Info,
  Edit2,
  Filter,
  Compass,
  Clock,
  Lightbulb,
  UserCheck,
  CreditCard,
  PlusCircle,
  Printer,
  Clipboard,
  Activity,
  Calendar,
  ArrowLeft,
  DollarSign,
  Eye,
  EyeOff,
  Home,
  Heart,
  Smile,
  Award
} from "lucide-react";

// CSV Headers and Matching Mapping
const headerMapping: Record<string, string[]> = {
  name: ["name", "fullname", "full name", "client name", "client", "contact name"],
  email: ["email", "e-mail", "emailaddress", "email address", "corporate email"],
  phone: ["phone", "phonenumber", "phone number", "contact", "contact number", "tel", "mobile"],
  company: ["company", "companyname", "company name", "organization", "firm", "client company"],
  role: ["role", "position", "title", "job title", "professional role"],
  notes: ["notes", "note", "comment", "comments", "description", "corporate notes", "context"]
};

function getFieldKey(header: string): string | null {
  const cleanHeader = header.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
  for (const [key, aliases] of Object.entries(headerMapping)) {
    if (aliases.includes(cleanHeader) || aliases.some(alias => cleanHeader.includes(alias))) {
      return key;
    }
  }
  return null;
}

// Robust, quote-aware CSV state-machine parser
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = "";
      } else if (char === '\r' || char === '\n') {
        row.push(cell.trim());
        if (row.length > 1 || row[0] !== "") {
          result.push(row);
        }
        row = [];
        cell = "";
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip LF
        }
      } else {
        cell += char;
      }
    }
  }
  
  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }
  
  return result;
}

export const ContactsSection: React.FC = () => {
  const { 
    contacts, 
    addContact, 
    bulkAddContacts,
    updateContact, 
    deleteContact,
    gmailMessages = [],
    meetEvents = [],
    invoices = [],
    projects = [],
    activityLogs = []
  } = useCRM();

  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // CSV Import States
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<any[]>([]);
  const [isPerformingImport, setIsPerformingImport] = useState(false);

  // CSV drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert("Please upload a valid CSV file.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const rows = parseCSV(text);
        validateCSVData(rows);
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
    };
    reader.readAsText(file);
  };

  const validateCSVData = (rows: string[][]) => {
    if (rows.length < 2) {
      alert("The CSV file must contain at least a header row and one data row.");
      return;
    }
    
    const headers = rows[0];
    const headerIndices: Record<string, number> = {};
    
    headers.forEach((header, idx) => {
      const key = getFieldKey(header);
      if (key) {
        headerIndices[key] = idx;
      }
    });
    
    if (headerIndices.name === undefined || headerIndices.email === undefined) {
      alert("Could not identify 'Name' or 'Email' columns in the CSV. Please ensure your CSV headers contain 'Name' and 'Email' as columns.");
      return;
    }
    
    const parsed: any[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;
      
      const getValue = (key: string): string => {
        const idx = headerIndices[key];
        return idx !== undefined && idx < row.length ? row[idx].trim() : "";
      };
      
      const contactData = {
        name: getValue("name"),
        email: getValue("email"),
        phone: getValue("phone"),
        company: getValue("company"),
        role: getValue("role"),
        notes: getValue("notes"),
      };
      
      const errors: string[] = [];
      let status: "valid" | "invalid" | "duplicate" = "valid";
      
      if (!contactData.name) {
        errors.push("Name is required");
      }
      
      if (!contactData.email) {
        errors.push("Email is required");
      } else if (!emailRegex.test(contactData.email)) {
        errors.push("Invalid email format");
      }
      
      if (errors.length > 0) {
        status = "invalid";
      } else {
        const isDup = contacts.some(c => c.email.toLowerCase() === contactData.email.toLowerCase());
        if (isDup) {
          status = "duplicate";
        }
      }
      
      parsed.push({
        data: contactData,
        status,
        errors,
        selected: status !== "invalid", // Auto-select valid/duplicates by default
      });
    }
    
    setParsedContacts(parsed);
  };

  const toggleSelectContact = (index: number) => {
    setParsedContacts(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
  };

  const downloadTemplate = () => {
    const csvContent = "Name,Email,Phone,Company,Role,Notes\n" +
      '"Dr. Miles Dyson","dyson@cyberdyne.io","+1 (555) 124-5000","Cyberdyne Systems","Director of R&D","Key decision maker, historical engagements."\n' +
      '"Sarah Connor","sarah@resistance.net","+1 (555) 987-6543","Resistance LLC","Security Analyst","Focuses on system safety and strategic planning."\n' +
      '"John Connor","john@resistance.net","","Resistance LLC","Team Lead","Excellent tactical lead."';
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "crm_contacts_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async () => {
    const recordsToImport = parsedContacts
      .filter(p => p.selected && p.status !== "invalid")
      .map(p => p.data);
      
    if (recordsToImport.length === 0) {
      alert("No valid records selected to import.");
      return;
    }
    
    setIsPerformingImport(true);
    try {
      await bulkAddContacts(recordsToImport);
      setParsedContacts([]);
      setIsImporting(false);
    } catch (err) {
      console.error(err);
      alert("Failed to import contacts. Please try again.");
    } finally {
      setIsPerformingImport(false);
    }
  };

  // Compute validation stats dynamically from current parsedContacts state
  const totalParsed = parsedContacts.length;
  const selectedCount = parsedContacts.filter(p => p.selected && p.status !== "invalid").length;
  const invalidCount = parsedContacts.filter(p => p.status === "invalid").length;
  const duplicateCount = parsedContacts.filter(p => p.status === "duplicate").length;
  const validCount = parsedContacts.filter(p => p.status === "valid").length;

  // AI Contact Briefing states
  const [aiBriefingContact, setAiBriefingContact] = useState<any | null>(null);
  const [aiBriefingText, setAiBriefingText] = useState("");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [aiBriefingError, setAiBriefingError] = useState("");

  const handleGenerateBriefing = async (contact: any) => {
    setAiBriefingContact(contact);
    setIsBriefingLoading(true);
    setAiBriefingError("");
    setAiBriefingText("");

    try {
      const prompt = `You are an elite executive coach and strategic operations planner.
      Generate a bespoke Client Meeting Briefing Guide for preparing a call or consulting session with this contact:
      
      Contact Profile:
      - Full Name: ${contact.name}
      - Position / Role: ${contact.role || "N/A"}
      - Corporate Affiliation: ${contact.company || "N/A"}
      - Professional Notes & Context: ${contact.notes || "No special notes. Establish high-trust rapport in event/operations consulting."}

      Provide a brief 3-sentence summary of their strategic importance, followed by 3 actionable, bulleted Talking Points and preparation recommendations specifically customized to their corporate role and consultancy niche. Keep it clear, executive-grade, concise, and professional.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiBriefingText(data.text);
    } catch (err: any) {
      console.error(err);
      setAiBriefingError(err.message || "Failed to generate meeting preparation briefing.");
    } finally {
      setIsBriefingLoading(false);
    }
  };

  // AI Quick Insight states
  const [insightContact, setInsightContact] = useState<any | null>(null);
  const [insightSummary, setInsightSummary] = useState("");
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [detectedInteractions, setDetectedInteractions] = useState<any[]>([]);

  const getContactInteractions = (contact: any) => {
    const interactions: Array<{ type: string; title: string; detail: string; date: string; timestamp: number }> = [];

    // 1. Gmail messages
    if (gmailMessages) {
      gmailMessages.forEach((msg: any) => {
        const isFrom = msg.from?.toLowerCase().includes(contact.email.toLowerCase()) || 
                       (msg.fromName && msg.fromName.toLowerCase().includes(contact.name.toLowerCase()));
        const isTo = msg.to?.toLowerCase().includes(contact.email.toLowerCase());
        if (isFrom || isTo) {
          interactions.push({
            type: "Email",
            title: msg.subject,
            detail: msg.body,
            date: msg.date,
            timestamp: new Date(msg.date).getTime() || 0
          });
        }
      });
    }

    // 2. Meet events
    if (meetEvents) {
      meetEvents.forEach((evt: any) => {
        if (evt.contactName?.toLowerCase() === contact.name.toLowerCase()) {
          interactions.push({
            type: "Meeting",
            title: evt.title,
            detail: `Scheduled on ${evt.date} at ${evt.time}. Link: ${evt.meetLink}`,
            date: evt.date,
            timestamp: new Date(`${evt.date}T${evt.time}`).getTime() || new Date(evt.date).getTime() || 0
          });
        }
      });
    }

    // 3. Invoices
    if (invoices) {
      invoices.forEach((inv: any) => {
        if (inv.contactName?.toLowerCase() === contact.name.toLowerCase()) {
          interactions.push({
            type: "Invoice",
            title: `Invoice ${inv.invoiceNumber}`,
            detail: `Amount: $${inv.amount}, Status: ${inv.status}, Due: ${inv.dueDate}`,
            date: inv.createdAt || inv.dueDate,
            timestamp: new Date(inv.createdAt || inv.dueDate).getTime() || 0
          });
        }
      });
    }

    // 4. Projects
    if (projects) {
      projects.forEach((proj: any) => {
        if (proj.contactName?.toLowerCase() === contact.name.toLowerCase()) {
          interactions.push({
            type: "Project",
            title: proj.name,
            detail: `Status: ${proj.status}, Value: $${proj.value}, Deadline: ${proj.deadline}. ${proj.description || ""}`,
            date: proj.createdAt || proj.deadline,
            timestamp: new Date(proj.createdAt || proj.deadline).getTime() || 0
          });
        }
      });
    }

    // 5. Activity logs
    if (activityLogs) {
      activityLogs.forEach((log: any) => {
        const descLower = log.description?.toLowerCase() || "";
        const actionLower = log.action?.toLowerCase() || "";
        const nameLower = contact.name.toLowerCase();
        const emailLower = contact.email.toLowerCase();
        if (descLower.includes(nameLower) || descLower.includes(emailLower) || actionLower.includes(nameLower) || actionLower.includes(emailLower)) {
          interactions.push({
            type: "Activity Log",
            title: log.action,
            detail: log.description,
            date: log.timestamp,
            timestamp: new Date(log.timestamp).getTime() || 0
          });
        }
      });
    }

    // 6. Contact Notes
    if (contact.notes) {
      interactions.push({
        type: "Note",
        title: "Contact Profile Notes",
        detail: contact.notes,
        date: contact.createdAt || new Date().toISOString(),
        timestamp: new Date(contact.createdAt || new Date()).getTime() || 0
      });
    }

    // Sort by timestamp descending
    interactions.sort((a, b) => b.timestamp - a.timestamp);

    // Return the last 5 (most recent first)
    return interactions.slice(0, 5);
  };

  const handleGenerateInsight = async (contact: any) => {
    setInsightContact(contact);
    setIsInsightLoading(true);
    setInsightError("");
    setInsightSummary("");
    
    const lastInteractions = getContactInteractions(contact);
    setDetectedInteractions(lastInteractions);

    try {
      if (lastInteractions.length === 0) {
        setInsightSummary("No interactions or activity records found for this contact yet. Start by sending an email, scheduling a meeting, drafting notes, or generating an invoice!");
        setIsInsightLoading(false);
        return;
      }

      const prompt = `You are an advanced corporate intelligence AI.
Analyze the following last ${lastInteractions.length} interaction records for the client contact ${contact.name} (${contact.role || "N/A"} at ${contact.company || "N/A"}):

${lastInteractions.map((it, idx) => `Interaction #${idx + 1}:
- Type: ${it.type}
- Action/Title: ${it.title}
- Details: ${it.detail}
- Date: ${it.date}`).join("\n\n")}

Based ONLY on these specific interactions, generate a concise, professional bullet-point summary summarizing:
1. The current engagement health/status and overall trend.
2. Major active topics, tasks, or milestones discussed or processed.
3. Recommended next touchpoint action or prompt follow-up detail.

Keep the tone expert, brief, actionable, and formatted in clear bullet points. Avoid preamble or introductory phrases (e.g. do not say "Here is the summary").`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setInsightSummary(data.text);
    } catch (err: any) {
      console.error(err);
      setInsightError(err.message || "Failed to generate quick insights summary.");
    } finally {
      setIsInsightLoading(false);
    }
  };

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  
  // New fields
  const [status, setStatus] = useState<Contact["status"]>("Active");
  const [leadSource, setLeadSource] = useState<Contact["leadSource"]>("Referral");
  const [recentInteraction, setRecentInteraction] = useState<Contact["recentInteraction"]>("Over 30 Days");

  // Extended fields states
  const [dob, setDob] = useState("");
  const [ssn, setSsn] = useState("");
  const [address, setAddress] = useState("");
  const [employer, setEmployer] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">("");
  const [referralName, setReferralName] = useState("");
  const [referralDate, setReferralDate] = useState("");

  // Edit states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeHubContact, setActiveHubContact] = useState<Contact | null>(null);

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [selectedInteraction, setSelectedInteraction] = useState<string>("All");

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsAdding(false);
    setIsImporting(false);

    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone || "");
    setCompany(contact.company || "");
    setRole(contact.role || "");
    setNotes(contact.notes || "");
    setStatus(contact.status || "Active");
    setLeadSource(contact.leadSource || "Referral");
    setRecentInteraction(contact.recentInteraction || "Over 30 Days");

    // Load extended fields
    setDob(contact.dob || "");
    setSsn(contact.ssn || "");
    setAddress(contact.address || "");
    setEmployer(contact.employer || "");
    setMonthlyIncome(contact.monthlyIncome !== undefined ? contact.monthlyIncome : "");
    setReferralName(contact.referralName || "");
    setReferralDate(contact.referralDate || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const contactPayload = {
      name,
      email,
      phone,
      company,
      role,
      notes,
      status,
      leadSource,
      recentInteraction,
      dob: dob || undefined,
      ssn: ssn || undefined,
      address: address || undefined,
      employer: employer || undefined,
      monthlyIncome: monthlyIncome === "" ? undefined : Number(monthlyIncome),
      referralName: referralName || undefined,
      referralDate: referralDate || undefined
    };

    if (editingContact) {
      await updateContact(editingContact.id, contactPayload);
      setEditingContact(null);
    } else {
      await addContact({
        ...contactPayload,
        familyLinks: [],
        enrolledProducts: []
      });
    }

    // Reset Form
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setRole("");
    setNotes("");
    setStatus("Active");
    setLeadSource("Referral");
    setRecentInteraction("Over 30 Days");
    setDob("");
    setSsn("");
    setAddress("");
    setEmployer("");
    setMonthlyIncome("");
    setReferralName("");
    setReferralDate("");
    setIsAdding(false);
  };

  // Live filter counts calculation
  const getStatusCount = (statusVal: string) => {
    if (statusVal === "All") return contacts.length;
    return contacts.filter(c => (c.status || "Active") === statusVal).length;
  };

  const getSourceCount = (sourceVal: string) => {
    if (sourceVal === "All") return contacts.length;
    return contacts.filter(c => (c.leadSource || "Referral") === sourceVal).length;
  };

  const getInteractionCount = (interactionVal: string) => {
    if (interactionVal === "All") return contacts.length;
    return contacts.filter(c => (c.recentInteraction || "Over 30 Days") === interactionVal).length;
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
    );

    const contactStatus = c.status || "Active";
    const contactSource = c.leadSource || "Referral";
    const contactInteraction = c.recentInteraction || "Over 30 Days";

    const matchesStatus = selectedStatus === "All" || contactStatus === selectedStatus;
    const matchesSource = selectedSource === "All" || contactSource === selectedSource;
    const matchesInteraction = selectedInteraction === "All" || contactInteraction === selectedInteraction;

    return matchesSearch && matchesStatus && matchesSource && matchesInteraction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Client Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Directory of trusted project contacts and business partners</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => {
              setIsImporting(!isImporting);
              setIsAdding(false);
              setParsedContacts([]);
            }}
            className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
          >
            {isImporting ? <X size={16} /> : <FileSpreadsheet size={16} />}
            {isImporting ? "Close Import" : "Import CSV"}
          </button>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setIsImporting(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? "Cancel" : "Add Contact"}
          </button>
        </div>
      </div>

      {/* CSV Import Interface */}
      {isImporting && (
        <div className="space-y-4 animate-fade-in">
          {parsedContacts.length === 0 ? (
            /* Upload Screen */
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4" id="csv-upload-section">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <FileSpreadsheet size={18} className="text-emerald-500" />
                  Bulk Import Client Records via CSV
                </h3>
                <button 
                  type="button"
                  onClick={downloadTemplate}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Download size={13} />
                  Download CSV Template
                </button>
              </div>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center transition ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/10" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <Upload size={32} className="text-slate-400 mb-3 animate-bounce" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Drag and drop your CSV file here, or
                </p>
                <label className="mt-1.5 inline-block text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  browse computer
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 max-w-xs font-mono">
                  Accepts standard .csv up to 5MB. Must map 'Name' and 'Email' headers.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3.5 border border-slate-100 dark:border-slate-850 text-[11px] text-slate-500 space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase block tracking-wider">CSV Columns Information</span>
                <p>
                  We support flexible headers! Place your column headers on the first line. The importer will automatically detect and align columns regardless of order:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong className="text-slate-700 dark:text-slate-300">Name</strong> (required) — e.g. "Dr. Miles Dyson"</li>
                  <li><strong className="text-slate-700 dark:text-slate-300">Email</strong> (required) — e.g. "dyson@cyberdyne.io"</li>
                  <li><strong className="text-slate-700 dark:text-slate-300">Phone</strong> (optional) — e.g. "+1 (555) 124-5000"</li>
                  <li><strong className="text-slate-700 dark:text-slate-300">Company</strong> (optional) — e.g. "Cyberdyne Systems"</li>
                  <li><strong className="text-slate-700 dark:text-slate-300">Role</strong> (optional) — e.g. "Director of R&D"</li>
                  <li><strong className="text-slate-700 dark:text-slate-300">Notes</strong> (optional) — decision parameters, background etc.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Validation Preview Table Screen */
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-5" id="csv-preview-section">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center border-b border-slate-50 dark:border-slate-850 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <FileSpreadsheet size={18} className="text-emerald-500" />
                    CSV Import Validation Preview
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Review validation checks and choose records to finalize import</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setParsedContacts([])}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer"
                >
                  Upload Different File
                </button>
              </div>

              {/* Validation Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-3 rounded-lg text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Parsed</span>
                  <span className="text-lg font-extrabold text-slate-800 dark:text-slate-150 font-mono">{totalParsed}</span>
                </div>
                <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-950/20 p-3 rounded-lg text-center">
                  <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">New & Valid</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{validCount}</span>
                </div>
                <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/40 dark:border-amber-950/20 p-3 rounded-lg text-center">
                  <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Potential Dups</span>
                  <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">{duplicateCount}</span>
                </div>
                <div className="bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/40 dark:border-rose-950/20 p-3 rounded-lg text-center">
                  <span className="block text-[10px] font-bold text-rose-600 text-rose-400 uppercase tracking-wider">Errors</span>
                  <span className="text-lg font-extrabold text-rose-600 text-rose-400 font-mono">{invalidCount}</span>
                </div>
              </div>

              {/* Alert Banner */}
              {invalidCount > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-350">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Invalid Records Detected:</span> {invalidCount} rows contain validation errors (e.g., missing name or incorrect email structure). These rows will be excluded from the import automatically.
                  </div>
                </div>
              )}

              {duplicateCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-350">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Duplicate Emails Detected:</span> {duplicateCount} emails already exist in your CRM. You can uncheck them in the list below if you do not wish to re-import them.
                  </div>
                </div>
              )}

              {/* Scrollable Table of rows */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-3 w-10 text-center">Import</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Company / Role</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {parsedContacts.map((item, idx) => {
                      const isInvalid = item.status === "invalid";
                      const isDup = item.status === "duplicate";
                      const isValid = item.status === "valid";
                      
                      return (
                        <tr 
                          key={idx}
                          className={`transition ${
                            isInvalid 
                              ? "bg-rose-50/10 dark:bg-rose-950/5 text-slate-400" 
                              : item.selected 
                              ? "bg-blue-50/5 dark:bg-blue-950/5 hover:bg-blue-50/10 dark:hover:bg-blue-950/10" 
                              : "hover:bg-slate-50/30 dark:hover:bg-slate-850/30"
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox"
                              disabled={isInvalid}
                              checked={item.selected}
                              onChange={() => toggleSelectContact(idx)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            />
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isValid && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                                <CheckCircle size={10} /> Valid
                              </span>
                            )}
                            {isDup && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono" title="Already exists in CRM contacts">
                                <AlertTriangle size={10} /> Duplicate
                              </span>
                            )}
                            {isInvalid && (
                              <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono" title={item.errors.join(", ")}>
                                <AlertCircle size={10} /> Error
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-150">
                            {item.data.name || <span className="text-rose-500 italic">Missing</span>}
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                            {item.data.email || <span className="text-rose-500 italic">Missing</span>}
                            {isInvalid && item.errors.includes("Invalid email format") && (
                              <span className="block text-[10px] text-rose-500 font-sans">Invalid format</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700 dark:text-slate-200">{item.data.company || "—"}</div>
                            {item.data.role && <div className="text-[10px] text-slate-500">{item.data.role}</div>}
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                            {item.data.phone || "—"}
                          </td>
                          <td className="p-3 max-w-xs truncate text-slate-500" title={item.data.notes}>
                            {item.data.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-2.5 border-t border-slate-50 dark:border-slate-850">
                <div className="text-xs text-slate-500">
                  Selected <strong className="text-blue-600 dark:text-blue-400 font-mono">{selectedCount}</strong> / {totalParsed} records to import.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedContacts([]);
                      setIsImporting(false);
                    }}
                    className="border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImportSubmit}
                    disabled={selectedCount === 0 || isPerformingImport}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    {isPerformingImport ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Importing {selectedCount}...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={15} />
                        Import {selectedCount} Records
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Contact Form */}
      {(isAdding || editingContact) && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-4">
            <User size={18} className="text-blue-500" />
            {editingContact ? "Edit Client Profile" : "New Client Profile"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Full Name *</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Miles Dyson"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Corporate Email *</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. dyson@cyberdyne.io"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Contact Number</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 124-5000"
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
              <label className="block text-xs font-semibold text-slate-500 uppercase">Professional Role</label>
              <input 
                type="text" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Director of R&D"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Contact Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Lead">Lead</option>
                <option value="Partner">Partner</option>
                <option value="VIP">VIP</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Lead Source</label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Referral">Referral</option>
                <option value="Website">Website</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Event">Event</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Recent Interaction</label>
              <select
                value={recentInteraction}
                onChange={(e) => setRecentInteraction(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Over 30 Days">Over 30 Days</option>
                <option value="None">None</option>
              </select>
            </div>
            {/* Extended Personal Details Section */}
            <div className="md:col-span-3 border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
                Security Profile & Referral Auxiliary Info
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Social Security (SSN)</label>
                  <input 
                    type="text" 
                    value={ssn}
                    onChange={(e) => setSsn(e.target.value)}
                    placeholder="e.g. XXX-XX-XXXX"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Home/Billing Address</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main St, Los Angeles, CA"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Current Employer</label>
                  <input 
                    type="text" 
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    placeholder="e.g. Cyberdyne Labs"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Monthly Income ($)</label>
                  <input 
                    type="number" 
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 4500"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Referral Agent Name</label>
                  <input 
                    type="text" 
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Referral Date</label>
                  <input 
                    type="date" 
                    value={referralDate}
                    onChange={(e) => setReferralDate(e.target.value)}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Corporate Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Decision making parameters, historical engagements..."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setIsAdding(false);
                setEditingContact(null);
                setName("");
                setEmail("");
                setPhone("");
                setCompany("");
                setRole("");
                setNotes("");
                setStatus("Active");
                setLeadSource("Referral");
                setRecentInteraction("Over 30 Days");
              }}
              className="px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg"
            >
              {editingContact ? "Update Contact" : "Save Contact"}
            </button>
          </div>
        </form>
      )}

      {/* Split filter sidebar and card container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Quick-Filter Sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100">
              <Filter size={15} className="text-blue-500" />
              <span>Quick Filters</span>
            </div>
            {(selectedStatus !== "All" || selectedSource !== "All" || selectedInteraction !== "All") && (
              <button
                onClick={() => {
                  setSelectedStatus("All");
                  setSelectedSource("All");
                  setSelectedInteraction("All");
                }}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-mono font-bold uppercase tracking-wider cursor-pointer hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Filter Group: Status */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Status</span>
            <div className="space-y-1">
              {["All", "Active", "Lead", "Partner", "VIP", "Inactive"].map(st => {
                const isActive = selectedStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer text-left ${
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold border border-blue-100/50 dark:border-blue-950/50" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        st === "All" ? "bg-slate-400" :
                        st === "Active" ? "bg-emerald-500" :
                        st === "Lead" ? "bg-amber-500" :
                        st === "Partner" ? "bg-blue-500" :
                        st === "VIP" ? "bg-purple-500" : "bg-slate-400"
                      }`} />
                      {st}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? "bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      {getStatusCount(st)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Group: Recent Interaction */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Recent Interaction</span>
            <div className="space-y-1">
              {["All", "Today", "This Week", "This Month", "Over 30 Days", "None"].map(st => {
                const isActive = selectedInteraction === st;
                return (
                  <button
                    key={st}
                    onClick={() => setSelectedInteraction(st)}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer text-left ${
                      isActive 
                        ? "bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-100/50 dark:border-rose-950/50" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 border border-transparent"
                    }`}
                  >
                    <span className="truncate">{st}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? "bg-rose-100/50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      {getInteractionCount(st)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Group: Lead Source */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Lead Source</span>
            <div className="space-y-1">
              {["All", "Referral", "Website", "Cold Outreach", "Event", "LinkedIn", "Other"].map(st => {
                const isActive = selectedSource === st;
                return (
                  <button
                    key={st}
                    onClick={() => setSelectedSource(st)}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer text-left ${
                      isActive 
                        ? "bg-amber-50/50 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-100/50 dark:border-amber-950/50" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 border border-transparent"
                    }`}
                  >
                    <span className="truncate">{st}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? "bg-amber-100/50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      {getSourceCount(st)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800/80">
            Showing {filteredContacts.length} of {contacts.length} entries
          </div>
        </div>

        {/* Directory Search & Cards Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Directory Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm relative">
            <Search className="absolute left-7 top-6 text-slate-400" size={16} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search directory by contact name, company, position, or email..."
              className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm bg-transparent dark:text-slate-100" 
            />
          </div>

          {/* Contacts Cards Grid */}
          {filteredContacts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl py-12 text-center">
              <User size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium">No contacts found.</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Ensure search string or active filters are correct.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                            <PrivateText type="name">{contact.name}</PrivateText>
                          </h3>
                          <span className={`inline-flex items-center text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                            (contact.status || "Active") === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50" :
                            (contact.status || "Active") === "Lead" ? "bg-amber-50 text-amber-700 border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50" :
                            (contact.status || "Active") === "Partner" ? "bg-blue-50 text-blue-700 border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50" :
                            (contact.status || "Active") === "VIP" ? "bg-purple-50 text-purple-700 border-purple-100/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50" :
                            "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/50"
                          }`}>
                            {contact.status || "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Briefcase size={12} className="text-slate-400" />
                          {contact.role || "Professional Contact"}
                        </p>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button
                          onClick={() => handleGenerateInsight(contact)}
                          className="p-1 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 rounded hover:bg-amber-50 dark:hover:bg-amber-950/20 transition cursor-pointer"
                          title="Generate AI Quick Insights of last 5 interactions"
                        >
                          <Lightbulb size={14} className="fill-current" />
                        </button>
                        <button
                          onClick={() => handleGenerateBriefing(contact)}
                          className="p-1 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 rounded hover:bg-purple-50 dark:hover:bg-purple-950/20 transition cursor-pointer"
                          title="Generate executive preparation guide with Gemini AI"
                        >
                          <Sparkles size={14} className="fill-current" />
                        </button>
                        <button
                          onClick={() => handleEditClick(contact)}
                          className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 transition cursor-pointer"
                          title="Edit Contact Profile"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { if(confirm("Delete contact profile?")) deleteContact(contact.id); }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-50 dark:border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Building size={12} className="text-slate-400" />
                        <span>Company: <strong className="font-semibold"><PrivateText>{contact.company || "—"}</PrivateText></strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Mail size={12} className="text-slate-400" />
                        <span>Email: <strong className="font-mono font-medium"><PrivateText type="email">{contact.email}</PrivateText></strong></span>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Phone size={12} className="text-slate-400" />
                          <span>Phone: <strong className="font-mono"><PrivateText type="phone">{contact.phone}</PrivateText></strong></span>
                        </div>
                      )}

                      {/* Brand-new badges for Source and Recent Interaction */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                          <Compass size={10} className="text-slate-400" />
                          Source: <strong className="text-slate-600 dark:text-slate-300 font-medium">{contact.leadSource || "Referral"}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                          <Clock size={10} className="text-slate-400" />
                          Last Interaction: <strong className="text-slate-600 dark:text-slate-300 font-medium">{contact.recentInteraction || "Over 30 Days"}</strong>
                        </span>
                      </div>
                    </div>
                    
                    {contact.notes && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                          <FileText size={10} /> Notes
                        </p>
                        <p className="text-xs text-slate-500 mt-1 italic">
                          <PrivateText>"{contact.notes}"</PrivateText>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-50 dark:border-slate-800/40 pt-3">
                    <button
                      onClick={() => setActiveHubContact(contact)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer grow justify-center"
                    >
                      <UserCheck size={12} />
                      Access Client Hub & Letters
                    </button>
                    <div className="text-[9px] text-slate-400 font-mono shrink-0">
                      Logged: {new Date(contact.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Contact Briefing Modal */}
      {aiBriefingContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-500 fill-purple-100 animate-pulse" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Executive Prep Brief: {aiBriefingContact.name}
                </h3>
              </div>
              <button 
                onClick={() => { setAiBriefingContact(null); setAiBriefingText(""); }} 
                className="text-slate-400 hover:text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {isBriefingLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <span className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs text-slate-500 font-mono uppercase tracking-wide">Synthesizing profile parameters...</span>
              </div>
            ) : aiBriefingError ? (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{aiBriefingError}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-500 font-medium">
                  Tailored conversational recommendations and key briefing parameters for client <strong className="text-slate-700 dark:text-slate-200">{aiBriefingContact.name}</strong> ({aiBriefingContact.role || "N/A"} at {aiBriefingContact.company || "N/A"}).
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                  <div className="whitespace-pre-line text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {aiBriefingText}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiBriefingText);
                      alert("Preparation briefing copied to clipboard.");
                    }}
                    className="bg-black dark:bg-slate-800 text-white hover:bg-neutral-800 dark:hover:bg-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Copy Briefing
                  </button>
                  <button
                    onClick={() => { setAiBriefingContact(null); setAiBriefingText(""); }}
                    className="border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Quick Insight Modal */}
      {insightContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Lightbulb className="text-amber-500 fill-amber-100 animate-pulse animate-duration-1000" size={18} />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Quick Insight Summary: {insightContact.name}
                </h3>
              </div>
              <button 
                onClick={() => { setInsightContact(null); setInsightSummary(""); }} 
                className="text-slate-400 hover:text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Column: List of Detected Interactions */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Analyzed History ({detectedInteractions.length})
                </h4>
                {detectedInteractions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No historical activities found.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                    {detectedInteractions.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-2 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${
                            item.type === "Email" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" :
                            item.type === "Meeting" ? "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400" :
                            item.type === "Invoice" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" :
                            item.type === "Project" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" :
                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: AI Output */}
              <div className="md:col-span-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Engagement Insights
                </h4>
                {isInsightLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-slate-50/30 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-xs text-slate-500 font-mono uppercase tracking-wide">Evaluating interactions...</span>
                  </div>
                ) : insightError ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{insightError}</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-lg p-4 max-h-[45vh] overflow-y-auto">
                    <div className="whitespace-pre-line text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {insightSummary}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800">
              {insightSummary && !isInsightLoading && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(insightSummary);
                    alert("Quick Insight summary copied to clipboard.");
                  }}
                  className="bg-black dark:bg-slate-800 text-white hover:bg-neutral-800 dark:hover:bg-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Copy Insights
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => { setInsightContact(null); setInsightSummary(""); }}
                className="border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Client Profile Hub Modal */}
      {activeHubContact && (
        <ClientProfileHubModal
          isOpen={!!activeHubContact}
          onClose={() => setActiveHubContact(null)}
          contact={contacts.find(c => c.id === activeHubContact.id) || activeHubContact}
        />
      )}
    </div>
  );
};
