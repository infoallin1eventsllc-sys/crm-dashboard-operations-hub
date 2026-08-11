import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User, 
  Target, 
  ListTodo, 
  CheckCircle2, 
  Plus, 
  AlertCircle,
  Briefcase,
  TrendingUp,
  Mail,
  Phone,
  Building,
  Info
} from "lucide-react";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = "lead" | "todo" | "contact";

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { addLead, addTodoTask, addContact, projects } = useCRM();
  const [activeTab, setActiveTab] = useState<ActiveTab>("lead");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ type: ActiveTab; name: string } | null>(null);

  // Lead Form State
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [leadStatus, setLeadStatus] = useState<"New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost">("New");
  const [leadSource, setLeadSource] = useState("Quick Add");
  const [leadNotes, setLeadNotes] = useState("");

  // Todo Form State
  const [todoTitle, setTodoTitle] = useState("");
  const [todoDesc, setTodoDesc] = useState("");
  const [todoStatus, setTodoStatus] = useState<"Todo" | "In Progress" | "Done">("Todo");
  const [todoPriority, setTodoPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [todoDueDate, setTodoDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [todoProjectId, setTodoProjectId] = useState("");

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  // Reset all forms
  const resetForms = () => {
    setError(null);
    setSuccessData(null);
    setIsSubmitting(false);

    // Reset Lead
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadCompany("");
    setLeadValue("");
    setLeadStatus("New");
    setLeadSource("Quick Add");
    setLeadNotes("");

    // Reset Todo
    setTodoTitle("");
    setTodoDesc("");
    setTodoStatus("Todo");
    setTodoPriority("Medium");
    const today = new Date();
    setTodoDueDate(today.toISOString().split("T")[0]);
    setTodoProjectId("");

    // Reset Contact
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactCompany("");
    setContactRole("");
    setContactNotes("");
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (activeTab === "lead") {
        if (!leadName.trim()) throw new Error("Prospect name is required.");
        if (!leadEmail.trim()) throw new Error("Email address is required.");
        
        await addLead({
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          company: leadCompany.trim() || "Independent",
          value: parseFloat(leadValue) || 0,
          status: leadStatus,
          source: leadSource,
          notes: leadNotes.trim()
        });

        setSuccessData({ type: "lead", name: leadName.trim() });
      } else if (activeTab === "todo") {
        if (!todoTitle.trim()) throw new Error("Task title is required.");

        await addTodoTask({
          title: todoTitle.trim(),
          description: todoDesc.trim(),
          status: todoStatus,
          priority: todoPriority,
          dueDate: todoDueDate,
          projectId: todoProjectId || undefined
        });

        setSuccessData({ type: "todo", name: todoTitle.trim() });
      } else if (activeTab === "contact") {
        if (!contactName.trim()) throw new Error("Contact name is required.");
        if (!contactEmail.trim()) throw new Error("Email address is required.");

        await addContact({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          company: contactCompany.trim() || "Independent",
          role: contactRole.trim() || "General Contact",
          notes: contactNotes.trim()
        });

        setSuccessData({ type: "contact", name: contactName.trim() });
      }
    } catch (err: any) {
      console.error("Quick Add Error: ", err);
      setError(err?.message || "An unexpected error occurred during creation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 overflow-y-auto" id="quick-add-container">
          
          {/* Backdrop Mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            id="quick-add-backdrop"
          />

          {/* Modal Box Alignment Container */}
          <div className="flex min-h-screen items-center justify-center p-4">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-xl bg-[#F4F1EA] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 focus:outline-hidden"
              id="quick-add-modal-box"
            >
              
              {/* Corner Design Tag */}
              <div className="absolute -top-3.5 -left-3 bg-[#FFD700] border-2 border-black px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                Global Workspace Action
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-black/60 hover:text-black border-2 border-transparent hover:border-black p-1 transition cursor-pointer"
                title="Close Modal"
                id="quick-add-close"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>

              {/* Title Section */}
              <div className="border-b border-black/10 pb-4 mb-5">
                <h3 className="text-2xl font-serif italic font-black tracking-tight text-black">
                  Rapid Record Entry
                </h3>
                <p className="text-[10px] font-mono uppercase tracking-wider text-black/50">
                  Create leads, assignments, or client profiles from any view
                </p>
              </div>

              {/* Success View */}
              {successData ? (
                <div className="text-center py-6 space-y-4" id="quick-add-success">
                  <div className="w-16 h-16 bg-[#FFD700] border-3 border-black mx-auto flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <CheckCircle2 size={32} className="text-black stroke-[2.5]" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-serif italic font-black text-black">
                      Record Synced Successfully!
                    </h4>
                    <p className="text-xs font-mono text-zinc-600 max-w-sm mx-auto">
                      Saved <span className="font-bold text-black font-sans">"{successData.name}"</span> as a new {successData.type} into your active database.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <button
                      onClick={() => {
                        setSuccessData(null);
                        setError(null);
                      }}
                      className="bg-white hover:bg-neutral-50 text-black border-2 border-black font-mono text-[10px] uppercase font-bold px-4 py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition cursor-pointer"
                      id="quick-add-another-btn"
                    >
                      Create Another Record
                    </button>
                    <button
                      onClick={handleClose}
                      className="bg-[#121212] hover:bg-neutral-800 text-white border-2 border-black font-mono text-[10px] uppercase font-bold px-5 py-2.5 shadow-[2px_2px_0px_0px_rgba(255,215,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition cursor-pointer"
                      id="quick-add-done-btn"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" id="quick-add-form">
                  
                  {/* Tabs Selector */}
                  <div className="grid grid-cols-3 gap-2" id="quick-add-tabs-container">
                    <button
                      type="button"
                      onClick={() => { setActiveTab("lead"); setError(null); }}
                      className={`py-2 border-2 border-black font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === "lead" 
                          ? "bg-[#FFD700] text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]" 
                          : "bg-white text-black/55 hover:text-black"
                      }`}
                      id="quick-add-tab-lead"
                    >
                      <Target size={12} className={activeTab === "lead" ? "stroke-[2.5]" : ""} />
                      Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab("todo"); setError(null); }}
                      className={`py-2 border-2 border-black font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === "todo" 
                          ? "bg-[#FFD700] text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]" 
                          : "bg-white text-black/55 hover:text-black"
                      }`}
                      id="quick-add-tab-todo"
                    >
                      <ListTodo size={12} className={activeTab === "todo" ? "stroke-[2.5]" : ""} />
                      Todo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab("contact"); setError(null); }}
                      className={`py-2 border-2 border-black font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === "contact" 
                          ? "bg-[#FFD700] text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]" 
                          : "bg-white text-black/55 hover:text-black"
                      }`}
                      id="quick-add-tab-contact"
                    >
                      <User size={12} className={activeTab === "contact" ? "stroke-[2.5]" : ""} />
                      Contact
                    </button>
                  </div>

                  {/* Error Notification Banner */}
                  {error && (
                    <div className="bg-red-50 border-2 border-red-500 p-3.5 flex items-start gap-2.5 text-red-700 animate-shake" id="quick-add-error">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 stroke-[2.5]" />
                      <div className="text-[11px] font-mono leading-normal">
                        <span className="font-bold">Database Error:</span> {error}
                      </div>
                    </div>
                  )}

                  {/* Form fields depending on active tab */}
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2" id="quick-add-fields-scroll">
                    
                    {/* TAB 1: LEAD FORM */}
                    {activeTab === "lead" && (
                      <div className="space-y-4" id="quick-add-fields-lead">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <User size={10} /> Contact Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={leadName}
                              onChange={(e) => setLeadName(e.target.value)}
                              placeholder="e.g. Johnathan Miller"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <Mail size={10} /> Email Address *
                            </label>
                            <input
                              type="email"
                              required
                              value={leadEmail}
                              onChange={(e) => setLeadEmail(e.target.value)}
                              placeholder="e.g. john@cyberdyne.io"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <Phone size={10} /> Phone Number
                            </label>
                            <input
                              type="text"
                              value={leadPhone}
                              onChange={(e) => setLeadPhone(e.target.value)}
                              placeholder="e.g. +1 (555) 124-5892"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <Building size={10} /> Company Name
                            </label>
                            <input
                              type="text"
                              value={leadCompany}
                              onChange={(e) => setLeadCompany(e.target.value)}
                              placeholder="e.g. Cyberdyne Systems"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <TrendingUp size={10} /> Est. Value ($)
                            </label>
                            <input
                              type="number"
                              value={leadValue}
                              onChange={(e) => setLeadValue(e.target.value)}
                              placeholder="e.g. 12500"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              Status
                            </label>
                            <select
                              value={leadStatus}
                              onChange={(e) => setLeadStatus(e.target.value as any)}
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden cursor-pointer"
                            >
                              <option value="New">New Prospect</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Qualified">Qualified</option>
                              <option value="Proposal">Proposal</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              Source
                            </label>
                            <input
                              type="text"
                              value={leadSource}
                              onChange={(e) => setLeadSource(e.target.value)}
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                            <Info size={10} /> Notes & Context
                          </label>
                          <textarea
                            value={leadNotes}
                            onChange={(e) => setLeadNotes(e.target.value)}
                            rows={3}
                            placeholder="Key details of conversational context, system specifications..."
                            className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 2: TODO TASK FORM */}
                    {activeTab === "todo" && (
                      <div className="space-y-4" id="quick-add-fields-todo">
                        <div>
                          <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                            Task Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={todoTitle}
                            onChange={(e) => setTodoTitle(e.target.value)}
                            placeholder="e.g. Audit database encryption keys"
                            className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                              Status
                            </label>
                            <select
                              value={todoStatus}
                              onChange={(e) => setTodoStatus(e.target.value as any)}
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden cursor-pointer"
                            >
                              <option value="Todo">Todo</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                              Priority
                            </label>
                            <select
                              value={todoPriority}
                              onChange={(e) => setTodoPriority(e.target.value as any)}
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden cursor-pointer"
                            >
                              <option value="Low">Low Priority</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High Priority</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                              Due Date
                            </label>
                            <input
                              type="date"
                              value={todoDueDate}
                              onChange={(e) => setTodoDueDate(e.target.value)}
                              className="mt-1.5 w-full bg-white border-2 border-black p-2 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {projects && projects.length > 0 && (
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <Briefcase size={10} /> Link To Project (Optional)
                            </label>
                            <select
                              value={todoProjectId}
                              onChange={(e) => setTodoProjectId(e.target.value)}
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden cursor-pointer"
                            >
                              <option value="">-- No linked project --</option>
                              {projects.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                  {proj.name} ({proj.contactName})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                            Task Description
                          </label>
                          <textarea
                            value={todoDesc}
                            onChange={(e) => setTodoDesc(e.target.value)}
                            rows={3}
                            placeholder="Detailed steps, references, files to review, or objectives..."
                            className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 3: CONTACT FORM */}
                    {activeTab === "contact" && (
                      <div className="space-y-4" id="quick-add-fields-contact">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <User size={10} /> Contact Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="e.g. Dr. Miles Dyson"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <Mail size={10} /> Email Address *
                            </label>
                            <input
                              type="email"
                              required
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              placeholder="e.g. dyson@cyberdyne.io"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <Phone size={10} /> Phone Number
                            </label>
                            <input
                              type="text"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder="e.g. +1 (555) 124-5000"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1">
                              <Building size={10} /> Company Name
                            </label>
                            <input
                              type="text"
                              value={contactCompany}
                              onChange={(e) => setContactCompany(e.target.value)}
                              placeholder="e.g. Cyberdyne Systems"
                              className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                            Role / Job Title
                          </label>
                          <input
                            type="text"
                            value={contactRole}
                            onChange={(e) => setContactRole(e.target.value)}
                            placeholder="e.g. Director of R&D"
                            className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono font-bold text-black uppercase tracking-wider">
                            Internal Reference & Notes
                          </label>
                          <textarea
                            value={contactNotes}
                            onChange={(e) => setContactNotes(e.target.value)}
                            rows={3}
                            placeholder="Additional context on relationship, preferred communication style..."
                            className="mt-1.5 w-full bg-white border-2 border-black p-2.5 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Submission and Footer Panel */}
                  <div className="border-t border-black/10 pt-5 flex justify-end gap-3" id="quick-add-footer">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleClose}
                      className="bg-white hover:bg-neutral-50 text-black border-2 border-black font-mono text-[10px] uppercase font-bold px-4 py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition cursor-pointer"
                      id="quick-add-cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#121212] hover:bg-neutral-800 text-white border-2 border-black font-mono text-[10px] uppercase font-bold px-5 py-2.5 shadow-[2px_2px_0px_0px_rgba(255,215,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
                      id="quick-add-submit-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Record...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} className="stroke-[2.5]" />
                          <span>Save {activeTab === "lead" ? "Prospect" : activeTab === "todo" ? "Task" : "Profile"}</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </motion.div>
          </div>

        </div>
      )}
    </AnimatePresence>
  );
};
