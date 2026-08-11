import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { 
  Target, 
  UserPlus, 
  CheckSquare, 
  StickyNote, 
  Plus, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";

export const QuickCaptureWidget: React.FC = () => {
  const { 
    addLead, 
    addContact, 
    addTodoTask, 
    addQuickNote 
  } = useCRM();

  const [activeTab, setActiveTab] = useState<"lead" | "contact" | "task" | "note">("lead");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Lead Form State
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadValue, setLeadValue] = useState("1000");

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactRole, setContactRole] = useState("");

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // Quick Note Form State
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState<"General" | "Lead" | "Project" | "Meeting" | "Invoice" | "Todo">("General");

  const handleTriggerSuccess = (msg: string) => {
    setIsSuccess(true);
    setSuccessMsg(msg);
    setTimeout(() => {
      setIsSuccess(false);
      setSuccessMsg("");
    }, 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === "lead") {
        if (!leadName) return;
        await addLead({
          name: leadName,
          email: leadEmail || `${leadName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: "",
          company: leadCompany || "Independent",
          value: Number(leadValue) || 0,
          status: "New",
          source: "Quick Capture",
          notes: "Created via dashboard quick capture panel."
        });
        setLeadName("");
        setLeadEmail("");
        setLeadCompany("");
        setLeadValue("1000");
        handleTriggerSuccess("Lead pipeline registered successfully!");
      } else if (activeTab === "contact") {
        if (!contactName) return;
        await addContact({
          name: contactName,
          email: contactEmail || `${contactName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: "",
          company: contactCompany || "Independent",
          role: contactRole || "Stakeholder",
          notes: "Created via dashboard quick capture panel."
        });
        setContactName("");
        setContactEmail("");
        setContactCompany("");
        setContactRole("");
        handleTriggerSuccess("Contact directory log appended!");
      } else if (activeTab === "task") {
        if (!taskTitle) return;
        await addTodoTask({
          title: taskTitle,
          description: "Created via dashboard quick capture panel.",
          status: "Todo",
          priority: taskPriority,
          dueDate: taskDueDate || new Date().toISOString().split("T")[0]
        });
        setTaskTitle("");
        setTaskDueDate("");
        setTaskPriority("Medium");
        handleTriggerSuccess("Operations board task pinned!");
      } else if (activeTab === "note") {
        if (!noteTitle || !noteContent) return;
        await addQuickNote({
          title: noteTitle,
          content: noteContent,
          category: noteCategory,
          isPinned: false
        });
        setNoteTitle("");
        setNoteContent("");
        setNoteCategory("General");
        handleTriggerSuccess("Workspace memo logged!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-5 flex flex-col h-full">
      {/* Widget Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Sparkles size={16} className="text-blue-500 animate-pulse" />
            Quick Capture Deck
          </h3>
          <p className="text-[11px] text-slate-400">Instantly record incoming business transactions</p>
        </div>

        {isSuccess && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40 animate-fade-in">
            <CheckCircle2 size={12} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("lead")}
          className={`py-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
            activeTab === "lead" 
              ? "bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Target size={13} />
          <span className="hidden sm:inline">Lead</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`py-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
            activeTab === "contact" 
              ? "bg-white dark:bg-slate-700 shadow-xs text-purple-600 dark:text-purple-400" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserPlus size={13} />
          <span className="hidden sm:inline">Contact</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("task")}
          className={`py-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
            activeTab === "task" 
              ? "bg-white dark:bg-slate-700 shadow-xs text-emerald-600 dark:text-emerald-400" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckSquare size={13} />
          <span className="hidden sm:inline">Task</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("note")}
          className={`py-1.5 rounded-md flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
            activeTab === "note" 
              ? "bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <StickyNote size={13} />
          <span className="hidden sm:inline">Memo</span>
        </button>
      </div>

      {/* Forms Switcher */}
      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between space-y-3.5">
        
        {activeTab === "lead" && (
          <div className="space-y-2.5 animate-fade-in text-xs">
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400">Lead / Deal Partner Name *</label>
              <input
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. John Miller"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400">Company</label>
                <input
                  type="text"
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  placeholder="e.g. Acmo Group"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400">Value ($)</label>
                <input
                  type="number"
                  value={leadValue}
                  onChange={(e) => setLeadValue(e.target.value)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400">Email Address</label>
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="e.g. j.miller@acmo.com"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-2.5 animate-fade-in text-xs">
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400">Contact Full Name *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Clara Oswald"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400">Company</label>
                <input
                  type="text"
                  value={contactCompany}
                  onChange={(e) => setContactCompany(e.target.value)}
                  placeholder="e.g. BBC Media"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400">Job Role / Title</label>
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="e.g. Creative Lead"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400">Email Address</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="clara@bbc.co.uk"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {activeTab === "task" && (
          <div className="space-y-2.5 animate-fade-in text-xs">
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400">Task Title *</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Draft proposal document..."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400">Priority Level</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-850 dark:bg-slate-900"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "note" && (
          <div className="space-y-2.5 animate-fade-in text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block font-bold text-slate-500 dark:text-slate-400">Memo Title *</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Call summary"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 dark:text-slate-400">Topic Category</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-850 dark:bg-slate-900"
                >
                  <option value="General">General</option>
                  <option value="Lead">Lead</option>
                  <option value="Project">Project</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Todo">Todo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-500 dark:text-slate-400">Notes Detail Content *</label>
              <textarea
                required
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Summarize important items here..."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs bg-transparent dark:text-slate-100"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-850 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-mono text-xs font-bold uppercase py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Plus size={14} />
          Register Event
        </button>

      </form>
    </div>
  );
};
