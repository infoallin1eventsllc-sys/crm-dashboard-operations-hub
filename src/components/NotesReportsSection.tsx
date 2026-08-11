import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { QuickNote } from "../types";
import { PrivateText } from "./PrivateText";
import { 
  Printer, 
  Plus, 
  Trash2, 
  Pin, 
  Search, 
  FileText, 
  Bookmark, 
  TrendingUp, 
  Briefcase, 
  Coins, 
  FileSignature, 
  CheckCircle,
  FileCheck,
  Tag,
  AlertCircle,
  Sparkles,
  Mic,
  MicOff
} from "lucide-react";

export function NotesReportsSection() {
  const { 
    quickNotes, 
    addQuickNote, 
    updateQuickNote, 
    deleteQuickNote,
    leads,
    projects,
    invoices,
    subscriptions,
    contacts,
    todoTasks
  } = useCRM();

  // Active section tabs
  const [activeSubTab, setActiveSubTab] = useState<"tracker" | "reports">("tracker");
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>("All");
  const [noteSearch, setNoteSearch] = useState<string>("");
  const [selectedNote, setSelectedNote] = useState<QuickNote | null>(quickNotes[0] || null);

  // Form states for a new note
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<QuickNote["category"]>("General");

  // Web Speech API Voice Transcription states
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [interimText, setInterimText] = useState("");
  const [listeningDuration, setListeningDuration] = useState(0);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState("");
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    let interval: any = null;
    if (isListening) {
      setListeningDuration(0);
      interval = setInterval(() => {
        setListeningDuration(prev => prev + 1);
      }, 1000);
    } else {
      setListeningDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startVoiceCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Your browser does not support the Web Speech API. Please try using Google Chrome, Microsoft Edge, or Safari.");
      return;
    }

    setVoiceError("");
    setInterimText("");
    setIsListening(true);

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      let finalTranscript = "";

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setInterimText(interimTranscript);
        
        if (finalTranscript) {
          setNewContent(prev => {
            const trimmedPrev = prev.trim();
            return trimmedPrev + (trimmedPrev ? " " : "") + finalTranscript;
          });
          finalTranscript = "";
        }
      };

      rec.onerror = (event: any) => {
        console.error("Web Speech error:", event.error);
        if (event.error !== "no-speech") {
          setVoiceError(`Voice recognition error: ${event.error}`);
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setVoiceError("Could not initialize microphone.");
      setIsListening(false);
    }
  };

  const stopVoiceCapture = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText("");
  };

  const handleAiFormatMemo = async () => {
    if (!newContent.trim()) return;
    setIsFormatting(true);
    setFormatError("");
    try {
      const prompt = `You are an expert corporate recorder. Please clean up, punctuate, correct grammar, organize into clear paragraphs (with a professional tone, but keeping all names, dates, numbers, and key facts exactly as dictated), and structure the following rough speech-to-text transcription of CRM/meeting notes:

"${newContent}"

Provide ONLY the cleanly formatted, structured text. Do not wrap the response in markdown quotes/code-blocks unless necessary, and do NOT add any introductory or concluding text (e.g. do not say "Here is your formatted text").`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      if (data.text) {
        setNewContent(data.text.trim());
      }
    } catch (err: any) {
      console.error(err);
      setFormatError(err.message || "Failed to format with AI.");
    } finally {
      setIsFormatting(false);
    }
  };

  const handleGenerateTitleWithAi = async () => {
    if (!newContent.trim()) return;
    try {
      const prompt = `Summarize the following memo content into a short, punchy 3-5 word professional title. Do not add quotes or punctuation:

"${newContent}"`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      if (data.text) {
        setNewTitle(data.text.trim().replace(/^"|"$/g, ''));
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Report states
  const [selectedReportType, setSelectedReportType] = useState<"sales" | "ops" | "finance" | "executive">("executive");

  // AI Boardroom Commentator states
  const [aiTone, setAiTone] = useState<string>("swot");
  const [aiReportText, setAiReportText] = useState<string>("");
  const [isAiGeneratingReport, setIsAiGeneratingReport] = useState<boolean>(false);
  const [aiReportErr, setAiReportErr] = useState<string>("");

  const handleGenerateAiReport = async () => {
    setIsAiGeneratingReport(true);
    setAiReportErr("");
    try {
      const statsSummary = `
        Report Type: ${selectedReportType}
        Total Leads: ${leads.length}
        Won Leads: ${leads.filter(l => l.status === "Won").length}
        Total Pipeline Value: $${leads.reduce((sum, l) => sum + (l.status !== "Lost" ? l.value : 0), 0)}
        Win Conversion Rate: ${leads.length > 0 ? Math.round((leads.filter(l => l.status === "Won").length / leads.length) * 100) : 0}%
        Total Projects Count: ${projects.length}
        Completed Projects: ${projects.filter(p => p.status === "Completed").length}
        Active Projects: ${projects.filter(p => p.status === "In Progress" || p.status === "In Review").length}
        Paid Invoices Sum: $${invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0)}
        Pending Invoices Sum: $${invoices.filter(i => i.status === "Sent").reduce((sum, i) => sum + i.amount, 0)}
        Overdue Invoices Sum: $${invoices.filter(i => i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0)}
        Total Annual SaaS Cost: $${((subscriptions.filter(s => s.status === "Active" && s.billingCycle === "Monthly").reduce((sum, s) => sum + s.cost, 0) * 12) + subscriptions.filter(s => s.status === "Active" && s.billingCycle === "Annual").reduce((sum, s) => sum + s.cost, 0))}
      `;

      const prompt = `Write a professional courtroom executive narrative analysis commentary for a Fortune 500 company based on the following CRM stats:
      ${statsSummary}

      Format option / Focus tone requested: "${aiTone}"
      - "swot": Structured SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis of the business pipeline and expenses.
      - "strategy": Strategic growth advice and lead acquisition recommendations.
      - "risk": Financial risk mitigation advice, overdue invoices analysis, and SaaS subscription cost control report.
      - "highlights": High-level board executive bullet highlights.

      Use elegant, highly polished, formal business language. Write a comprehensive, cohesive, paragraph-form advisory analysis. Do NOT use generic placeholders; speak with authority and precision. The output must be returned as beautiful plain text or standard markdown. Do not wrap the response in code blocks, just return the narrative itself directly.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiReportText(data.text);
    } catch (err: any) {
      console.error(err);
      setAiReportErr(err.message || "Failed to generate AI executive analysis commentary.");
    } finally {
      setIsAiGeneratingReport(false);
    }
  };

  // Handle Note Save
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await addQuickNote({
      title: newTitle,
      content: newContent,
      category: newCategory,
      isPinned: false
    });

    setNewTitle("");
    setNewContent("");
    setNewCategory("General");
    setIsAddingNote(false);
  };

  // Toggle Pinned Status
  const handleTogglePin = async (note: QuickNote) => {
    await updateQuickNote(note.id, { isPinned: !note.isPinned });
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    await deleteQuickNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  // Printing Helper
  const triggerPrint = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    // Create a temporary container for printing to guarantee absolute high-fidelity clean reports
    const originalContent = document.body.innerHTML;
    
    // Add custom printing CSS stylesheet specifically for the newsprint look
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body {
          background-color: #ffffff !important;
          color: #000000 !important;
          font-family: Georgia, serif !important;
          padding: 20px !important;
        }
        .no-print {
          display: none !important;
        }
        .print-container {
          border: 3px double #000000 !important;
          padding: 30px !important;
          margin: 0 !important;
          box-shadow: none !important;
          background: #ffffff !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        th, td {
          border: 1px solid #000000 !important;
          padding: 8px !important;
        }
        th {
          background-color: #f0f0f0 !important;
          font-weight: bold !important;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();

    // Clean up temporary style tag
    document.head.removeChild(style);
  };

  // Filter notes based on category and search query
  const filteredNotes = quickNotes.filter(n => {
    const matchesCat = noteCategoryFilter === "All" || n.category === noteCategoryFilter;
    const matchesSearch = n.title.toLowerCase().includes(noteSearch.toLowerCase()) || 
                          n.content.toLowerCase().includes(noteSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Derived Calculations for reports
  // 1. Sales Calculations
  const totalLeadsCount = leads.length;
  const wonLeads = leads.filter(l => l.status === "Won");
  const qualifiedLeads = leads.filter(l => l.status === "Qualified" || l.status === "Proposal");
  const winRate = totalLeadsCount > 0 ? Math.round((wonLeads.length / totalLeadsCount) * 100) : 0;
  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.status !== "Lost" ? l.value : 0), 0);

  // 2. Ops Calculations
  const totalProjectsCount = projects.length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const activeProjects = projects.filter(p => p.status === "In Progress" || p.status === "In Review").length;
  
  // 3. Finance Calculations
  const paidInvoicesSum = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const pendingInvoicesSum = invoices.filter(i => i.status === "Sent").reduce((sum, i) => sum + i.amount, 0);
  const overdueInvoicesSum = invoices.filter(i => i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
  const monthlySaaSCost = subscriptions.filter(s => s.status === "Active" && s.billingCycle === "Monthly").reduce((sum, s) => sum + s.cost, 0);
  const annualSaaSCost = subscriptions.filter(s => s.status === "Active" && s.billingCycle === "Annual").reduce((sum, s) => sum + s.cost, 0);
  const totalAnnualOverhead = (monthlySaaSCost * 12) + annualSaaSCost;

  return (
    <div className="space-y-6">
      
      {/* Editorial Header Block */}
      <div className="border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-black/50">ARCHIVE & INTELLIGENCE DIVISION</span>
          <h2 className="text-4xl font-serif italic font-black text-[#121212]">REPORTS & MEMOS</h2>
          <p className="text-xs font-mono uppercase tracking-wider text-black/75 mt-1">Official CRM Documentation, Internal Memos, & Print-Friendly Audits</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-2 border-black p-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] self-start md:self-auto no-print">
          <button 
            onClick={() => setActiveSubTab("tracker")}
            className={`px-4 py-1.5 font-mono text-xs uppercase font-bold transition-all ${
              activeSubTab === "tracker" 
                ? "bg-black text-white" 
                : "text-black hover:bg-neutral-100"
            }`}
          >
            Quick Note Tracker
          </button>
          <button 
            onClick={() => setActiveSubTab("reports")}
            className={`px-4 py-1.5 font-mono text-xs uppercase font-bold transition-all ${
              activeSubTab === "reports" 
                ? "bg-black text-white" 
                : "text-black hover:bg-neutral-100"
            }`}
          >
            Print-Friendly Reports
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: QUICK NOTE TRACKER */}
      {activeSubTab === "tracker" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: List of notes & Filters */}
          <div className="lg:col-span-4 space-y-4 no-print">
            <div className="bg-white border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="text-lg font-serif italic font-bold">Search & Categories</h3>
              
              {/* Search bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
                <input 
                  type="text"
                  placeholder="SEARCH INTERNAL MEMOS..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-black font-mono text-xs uppercase tracking-wider"
                />
              </div>

              {/* Category buttons */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-black/10">
                {["All", "General", "Lead", "Project", "Invoice", "Todo"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoteCategoryFilter(cat)}
                    className={`px-2 py-1 font-mono text-[9px] uppercase font-bold border transition ${
                      noteCategoryFilter === cat 
                        ? "bg-black border-black text-white" 
                        : "bg-white border-black/30 text-black hover:border-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* New Note Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingNote(true);
                    setNewTitle("");
                    setNewContent("");
                  }}
                  className="py-2 bg-black text-white font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1.5 border border-black hover:bg-white hover:text-black transition cursor-pointer"
                >
                  <Plus size={12} />
                  Draft Memo
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingNote(true);
                    setNewCategory("Meeting");
                    setNewTitle(`Voice Dictation — ${new Date().toLocaleDateString()}`);
                    setNewContent("");
                    setTimeout(() => {
                      startVoiceCapture();
                    }, 150);
                  }}
                  className="py-2 bg-rose-600 text-white font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1.5 border border-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Mic size={12} />
                  Dictate Memo
                </button>
              </div>
            </div>

            {/* List scroll container */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredNotes.length === 0 ? (
                <div className="p-8 border border-dashed border-black/25 text-center bg-white/50">
                  <p className="text-xs font-mono uppercase tracking-wider text-black/40">No internal memos found</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div 
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-4 border cursor-pointer transition-all ${
                      selectedNote?.id === note.id 
                        ? "bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]" 
                        : "bg-white/80 border-black/20 hover:border-black hover:bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-1.5 py-0.5 bg-black text-white font-mono text-[8px] uppercase font-bold">
                        {note.category}
                      </span>
                      {note.isPinned && (
                        <Pin size={10} className="text-black stroke-[3]" />
                      )}
                    </div>
                    <h4 className="font-serif italic font-bold text-sm mt-2 line-clamp-1">{note.title}</h4>
                    <p className="font-mono text-[10px] text-black/60 line-clamp-2 mt-1 leading-normal">{note.content}</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/5 text-[9px] font-mono text-black/40">
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-black/40 hover:text-red-600 transition"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Note detail paper visual */}
          <div className="lg:col-span-8">
            
            {/* Slide-over/Insert form if adding a note */}
            {isAddingNote ? (
              <form onSubmit={handleSaveNote} className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="border-b border-black pb-2">
                  <h3 className="text-xl font-serif italic font-bold">Draft Internal Operational Memo</h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-black/50">Journal Operations Dispatch</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider block">Memo Category</label>
                    <select 
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value as QuickNote["category"])}
                      className="w-full"
                    >
                      <option value="General">General</option>
                      <option value="Lead">Lead Acquisition</option>
                      <option value="Project">Project Operation</option>
                      <option value="Meeting">Executive Consultation</option>
                      <option value="Invoice">Billing Ledger</option>
                      <option value="Todo">Kanban / Task</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider block">Memo Heading</label>
                      {newContent.trim() && (
                        <button
                          type="button"
                          onClick={handleGenerateTitleWithAi}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 cursor-pointer hover:underline no-print"
                          title="Generate title from content using AI"
                        >
                          <Sparkles size={11} className="fill-indigo-50" />
                          AI Auto Title
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="ENTER MEMO TITLE..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider block">Memo Body Text</label>
                    <div className="flex items-center gap-2 no-print">
                      {newContent.trim() && (
                        <button
                          type="button"
                          disabled={isFormatting}
                          onClick={handleAiFormatMemo}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-mono text-[9px] uppercase font-bold flex items-center gap-1 border border-black disabled:opacity-50 transition cursor-pointer"
                          title="Punctuate and format speech-to-text notes using Gemini"
                        >
                          {isFormatting ? (
                            <>
                              <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Polishing...
                            </>
                          ) : (
                            <>
                              <Sparkles size={10} className="stroke-[3]" />
                              AI Punctuate & Polish
                            </>
                          )}
                        </button>
                      )}

                      {isListening ? (
                        <button
                          type="button"
                          onClick={stopVoiceCapture}
                          className="px-2 py-1 bg-rose-600 text-white font-mono text-[9px] uppercase font-bold flex items-center gap-1 border border-black hover:bg-rose-700 animate-pulse transition cursor-pointer"
                        >
                          <MicOff size={10} className="stroke-[3]" />
                          Stop Capturing
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startVoiceCapture}
                          className="px-2 py-1 bg-black text-white font-mono text-[9px] uppercase font-bold flex items-center gap-1 border border-black hover:bg-neutral-850 transition cursor-pointer"
                        >
                          <Mic size={10} className="stroke-[3]" />
                          Transcribe Voice
                        </button>
                      )}
                    </div>
                  </div>

                  {/* High-Fidelity Recording Feedback Panel */}
                  {isListening && (
                    <div className="bg-rose-50 border border-rose-200 p-3 text-[11px] font-mono text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded shadow-inner">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                        </span>
                        <span className="font-bold">DICTATING... Speak clearly into your device</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Audio visualizer wave */}
                        <div className="flex items-end gap-0.5 h-4 w-14">
                          <div className="w-1 bg-rose-600 h-2 animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }}></div>
                          <div className="w-1 bg-rose-600 h-4 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.8s' }}></div>
                          <div className="w-1 bg-rose-600 h-3 animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.5s' }}></div>
                          <div className="w-1 bg-rose-600 h-1.5 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '0.7s' }}></div>
                          <div className="w-1 bg-rose-600 h-3 animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }}></div>
                        </div>
                        
                        <div className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded font-mono text-[10px]">
                          {formatDuration(listeningDuration)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Real-Time Speech Recognition Buffer View */}
                  {isListening && interimText && (
                    <div className="bg-neutral-50 border border-dashed border-neutral-300 p-3 rounded text-xs font-serif italic text-neutral-600 leading-relaxed shadow-sm">
                      <span className="block text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-1">Live Voice Stream preview:</span>
                      "{interimText}"
                    </div>
                  )}

                  {voiceError && (
                    <div className="bg-rose-50 border border-rose-200 p-2 text-[10px] font-mono text-rose-700 flex items-center gap-1.5 rounded">
                      <AlertCircle size={12} />
                      <span>{voiceError}</span>
                    </div>
                  )}

                  {formatError && (
                    <div className="bg-amber-50 border border-amber-200 p-2 text-[10px] font-mono text-amber-700 flex items-center gap-1.5 rounded">
                      <AlertCircle size={12} />
                      <span>{formatError}</span>
                    </div>
                  )}

                  <textarea 
                    rows={8}
                    placeholder="WRITE DOCUMENT DIRECTIVES OR START VOICE DICTATION..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    className="w-full font-mono text-xs border border-black p-3"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-black/10">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingNote(false)}
                    className="px-4 py-2 border border-black font-mono text-xs uppercase font-bold hover:bg-neutral-50 transition"
                  >
                    Cancel Draft
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-black text-white font-mono text-xs uppercase font-bold hover:bg-white hover:text-black transition"
                  >
                    Save & Dispatch Memo
                  </button>
                </div>
              </form>
            ) : selectedNote ? (
              <div className="space-y-4">
                {/* Visual Note Paper layout */}
                <div 
                  id="active-memo-print"
                  className="print-container bg-white border-2 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
                >
                  {/* Watermark header logo */}
                  <div className="absolute top-4 right-4 text-[9px] font-mono uppercase tracking-[0.2em] font-black text-black/20 text-right">
                    JOURNAL CRM ARCHIVE<br />MEMO DIRECTIVE
                  </div>

                  {/* Stamp detail */}
                  <div className="absolute top-24 right-12 border-2 border-red-600/30 text-red-600/30 text-[9px] font-mono uppercase font-black tracking-widest px-3 py-1.5 rotate-12 select-none pointer-events-none rounded border-dashed">
                    CONFIDENTIAL / RECORDED
                  </div>

                  {/* Memo top index */}
                  <div className="border-b-2 border-black pb-4 space-y-1">
                    <span className="px-2 py-0.5 bg-black text-white font-mono text-[9px] uppercase font-bold">
                      {selectedNote.category} DIRECTIVE
                    </span>
                    <h3 className="text-3xl font-serif italic font-black text-[#121212] mt-2 leading-tight">
                      {selectedNote.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase font-bold text-black/60 pt-4">
                      <div>
                        <p><span className="opacity-50">DATE:</span> {new Date(selectedNote.createdAt).toLocaleDateString()}</p>
                        <p><span className="opacity-50">AUTHOR:</span> SYSTEM OPERATOR</p>
                      </div>
                      <div className="text-right">
                        <p><span className="opacity-50">DOC REF:</span> #MEMO-{selectedNote.id.toUpperCase()}</p>
                        <p><span className="opacity-50">STATUS:</span> FILED IN CLOUD</p>
                      </div>
                    </div>
                  </div>

                  {/* Memo content block */}
                  <div className="py-8 font-serif text-base text-[#121212] leading-relaxed whitespace-pre-wrap">
                    {selectedNote.content}
                  </div>

                  {/* Memo sign-off line */}
                  <div className="border-t border-black/10 pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] font-mono uppercase font-bold">
                    <div>
                      <p className="opacity-50">AUDITED BY</p>
                      <p className="border-b border-black pb-1 w-48 mt-4"></p>
                      <p className="text-[9px] opacity-60 mt-1">CRM Operations Officer</p>
                    </div>
                    <div className="md:text-right">
                      <p className="opacity-50">SYSTEM SIGN-OFF</p>
                      <p className="font-mono text-red-600 italic tracking-widest mt-4">SECURELY ENCRYPTED & LOGGED</p>
                      <p className="text-[8px] opacity-40 mt-1">HASH: {selectedNote.id.toUpperCase()}-AX22</p>
                    </div>
                  </div>
                </div>

                {/* Print and interaction panel */}
                <div className="flex flex-wrap gap-2 justify-end no-print">
                  <button
                    onClick={() => handleTogglePin(selectedNote)}
                    className="px-4 py-2 border border-black bg-white font-mono text-xs uppercase font-bold flex items-center gap-2 hover:bg-neutral-50 transition"
                  >
                    <Pin size={12} className={selectedNote.isPinned ? "text-black fill-black" : "text-black"} />
                    {selectedNote.isPinned ? "Unpin Memo" : "Pin Memo"}
                  </button>
                  <button
                    onClick={() => triggerPrint("active-memo-print")}
                    className="px-5 py-2 bg-black text-white font-mono text-xs uppercase font-bold flex items-center gap-2 hover:bg-white hover:text-black border border-black transition"
                  >
                    <Printer size={12} />
                    Print Memo Direct
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 border-2 border-dashed border-black/25 text-center bg-white/40 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                <Bookmark size={36} className="mx-auto text-black/20 mb-3" />
                <h4 className="font-serif italic font-bold text-lg text-black/50">No Internal Memo Selected</h4>
                <p className="text-xs font-mono uppercase tracking-wider text-black/40 mt-1">Select a filed operational dispatch from the left index</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PRINT-FRIENDLY REPORTS */}
      {activeSubTab === "reports" && (
        <div className="space-y-6">
          
          {/* Report Type selector bar */}
          <div className="bg-white border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-2 justify-between items-center no-print">
            <span className="font-serif italic font-bold text-base text-black">Select Audit Dossier:</span>
            <div className="flex flex-wrap gap-1">
              {[
                { id: "executive", label: "Executive Summary", icon: FileSignature },
                { id: "sales", label: "Sales & Pipelines", icon: TrendingUp },
                { id: "ops", label: "Operations & Projects", icon: Briefcase },
                { id: "finance", label: "Financial Ledger & SaaS", icon: Coins }
              ].map((rep) => {
                const Icon = rep.icon;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedReportType(rep.id as any)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase font-bold flex items-center gap-2 border transition ${
                      selectedReportType === rep.id 
                        ? "bg-black border-black text-white" 
                        : "bg-white border-black/30 text-black hover:border-black"
                    }`}
                  >
                    <Icon size={12} />
                    {rep.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => triggerPrint("active-report-print")}
              className="px-4 py-1.5 bg-black text-white border border-black hover:bg-white hover:text-black font-mono text-xs uppercase font-bold flex items-center gap-2 transition"
            >
              <Printer size={13} />
              Print Selected Dossier
            </button>
          </div>

          {/* AI Boardroom Intelligence Analyst Panel */}
          <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 no-print">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-black/15 pb-3">
              <div>
                <h3 className="text-lg font-serif italic font-bold flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 animate-pulse fill-amber-600" />
                  Gemini Boardroom Intelligence Analyst
                </h3>
                <p className="text-[11px] font-mono uppercase tracking-wider text-black/60">Generate a custom AI-driven executive advisory commentary or SWOT analysis using real-time CRM ledger metrics.</p>
              </div>
              <span className="text-[9px] font-mono uppercase bg-black text-white px-2 py-0.5 font-bold tracking-widest mt-2 sm:mt-0">Gemini 3.5 Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-2">Select Analysis Tone Focus</label>
                <select 
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full text-xs font-mono border border-black px-3 py-2 bg-white"
                >
                  <option value="swot">Executive SWOT Analysis</option>
                  <option value="strategy">Strategic Growth & Lead Expansion</option>
                  <option value="risk">Risk Mitigation & Financial Cost Controls</option>
                  <option value="highlights">Board-Level High-Point Highlights</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="button"
                  disabled={isAiGeneratingReport}
                  onClick={handleGenerateAiReport}
                  className="flex-1 bg-black hover:bg-white hover:text-black text-white font-mono text-xs font-bold uppercase py-2.5 px-4 flex items-center justify-center gap-2 border border-black transition disabled:opacity-50 cursor-pointer"
                >
                  {isAiGeneratingReport ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Composing Executive Advisory...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Synthesize Boardroom Commentary
                    </>
                  )}
                </button>
                {aiReportText && (
                  <button
                    type="button"
                    onClick={() => setAiReportText("")}
                    className="border border-black hover:bg-neutral-100 text-black font-mono text-xs font-bold uppercase px-4 py-2.5"
                    title="Clear Commentary"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {aiReportErr && (
              <div className="text-red-600 text-xs font-mono uppercase font-bold animate-pulse flex items-center gap-1.5 pt-1">
                <AlertCircle size={13} />
                {aiReportErr}
              </div>
            )}
          </div>

          {/* REPORT SCREEN CANVAS DISPLAY */}
          <div 
            id="active-report-print"
            className="print-container bg-white border-2 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative space-y-8"
          >
            
            {/* 1. Header Banner of the report */}
            <div className="border-b-4 border-black pb-6 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-serif italic font-black text-black">THE JOURNAL CRM</h1>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-bold text-black/50">OPERATIONAL INTEL & LEDGER DOSSIER</span>
                </div>
                <div className="text-right font-mono text-[9px] uppercase font-bold text-black/60">
                  <p>REPORT TYPE: {selectedReportType.toUpperCase()}</p>
                  <p>DATE GENERATED: {new Date().toLocaleDateString()}</p>
                  <p>CONFIDENTIALITY TIER: FOUR (OFFICIAL)</p>
                </div>
              </div>
              <div className="h-1 bg-black"></div>
              <div className="flex justify-between text-[10px] font-mono uppercase font-bold text-black/70 mt-1">
                <span>SYSTEM VERSION 2.1-RELEASE</span>
                <span>LONDON CENTRAL OFFICE</span>
                <span>SYNC STATUS: COMPLETE CLOUD METRIC</span>
              </div>
            </div>

            {/* 2. REPORT CONTENT INJECTED BY TYPE */}
            {selectedReportType === "executive" && (
              <div className="space-y-6">
                <div className="border-l-4 border-black pl-4 py-1">
                  <h3 className="text-2xl font-serif italic font-bold text-black">Central Intelligence & Executive Order Summary</h3>
                  <p className="text-xs font-serif text-black/70 mt-1">
                    This executive summary compiles general indices across all divisions of Journal CRM, providing a complete 
                    look at active client pipeline, financial billing state, operational projects and overall CRM health metrics.
                  </p>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-b border-black py-4">
                  <div className="text-center md:border-r border-black/10 last:border-0 p-2">
                    <span className="text-[10px] font-mono uppercase font-bold opacity-60">ACTIVE FUNNEL VALUE</span>
                    <p className="text-2xl font-serif italic font-black text-black mt-1">
                      <PrivateText>{`$${totalPipelineValue.toLocaleString()}`}</PrivateText>
                    </p>
                  </div>
                  <div className="text-center md:border-r border-black/10 last:border-0 p-2">
                    <span className="text-[10px] font-mono uppercase font-bold opacity-60">WIN CONVERSION RATIO</span>
                    <p className="text-2xl font-serif italic font-black text-black mt-1">{winRate}%</p>
                  </div>
                  <div className="text-center md:border-r border-black/10 last:border-0 p-2">
                    <span className="text-[10px] font-mono uppercase font-bold opacity-60">ACTIVE OPERATIONS</span>
                    <p className="text-2xl font-serif italic font-black text-black mt-1">{activeProjects} / {totalProjectsCount}</p>
                  </div>
                  <div className="text-center p-2">
                    <span className="text-[10px] font-mono uppercase font-bold opacity-60">SaaS OVERHEAD COST</span>
                    <p className="text-2xl font-serif italic font-black text-black mt-1">${totalAnnualOverhead.toLocaleString()}/yr</p>
                  </div>
                </div>

                {/* Two Column Layout of executive report */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  {/* Left Column: Top Pipeline and Unpaid Invoices summary */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2">Active Lead Pipelines</h4>
                      <table className="w-full mt-2 text-xs">
                        <thead>
                          <tr>
                            <th className="text-left font-mono font-bold text-[10px] py-1 bg-transparent">LEAD NAME</th>
                            <th className="text-left font-mono font-bold text-[10px] py-1 bg-transparent">STAGE</th>
                            <th className="text-right font-mono font-bold text-[10px] py-1 bg-transparent">VALUE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.slice(0, 4).map(lead => (
                            <tr key={lead.id}>
                              <td className="py-1.5 font-serif italic font-semibold">{lead.name}</td>
                              <td className="py-1.5 font-mono text-[9px] uppercase font-bold">{lead.status}</td>
                              <td className="py-1.5 font-mono text-right font-bold"><PrivateText>{`$${lead.value.toLocaleString()}`}</PrivateText></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2">Unpaid Billing Ledger</h4>
                      <table className="w-full mt-2 text-xs">
                        <thead>
                          <tr>
                            <th className="text-left font-mono font-bold text-[10px] py-1 bg-transparent">INVOICE NO</th>
                            <th className="text-left font-mono font-bold text-[10px] py-1 bg-transparent">CLIENT</th>
                            <th className="text-right font-mono font-bold text-[10px] py-1 bg-transparent">DUE AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.filter(i => i.status !== "Paid").map(inv => (
                            <tr key={inv.id}>
                              <td className="py-1.5 font-mono font-bold text-[10px]">{inv.invoiceNumber}</td>
                              <td className="py-1.5 font-serif italic font-semibold">{inv.contactName}</td>
                              <td className="py-1.5 font-mono text-right text-red-600 font-bold"><PrivateText>{`$${inv.amount.toLocaleString()}`}</PrivateText></td>
                            </tr>
                          ))}
                          {invoices.filter(i => i.status !== "Paid").length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-4 text-center font-mono text-[10px] text-black/50 uppercase">All invoices settled</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Operations and internal briefs */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2">Operations & Projects Overview</h4>
                      <div className="space-y-4 mt-2">
                        {projects.slice(0, 3).map(proj => {
                          const completed = proj.subtasks.filter(s => s.isCompleted).length;
                          const total = proj.subtasks.length;
                          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                          return (
                            <div key={proj.id} className="border-b border-black/10 pb-3 last:border-0">
                              <div className="flex justify-between items-start">
                                <h5 className="font-serif italic font-bold text-sm text-black">{proj.name}</h5>
                                <span className="text-[10px] font-mono uppercase font-bold opacity-75">{proj.status}</span>
                              </div>
                              <p className="text-[10px] font-mono text-black/60 mt-1 uppercase">Deadline: {new Date(proj.deadline).toLocaleDateString()}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 bg-black/5 h-2 border border-black rounded-none overflow-hidden">
                                  <div className="bg-black h-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="text-[10px] font-mono font-bold">{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2">Active Task Registry</h4>
                      <table className="w-full mt-2 text-xs">
                        <thead>
                          <tr>
                            <th className="text-left font-mono font-bold text-[10px] py-1 bg-transparent">TASK DETAIL</th>
                            <th className="text-left font-mono font-bold text-[10px] py-1 bg-transparent">PRIORITY</th>
                            <th className="text-right font-mono font-bold text-[10px] py-1 bg-transparent">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todoTasks.slice(0, 4).map(task => (
                            <tr key={task.id}>
                              <td className="py-1.5 font-serif italic font-semibold">{task.title}</td>
                              <td className="py-1.5 font-mono text-[9px] uppercase font-bold text-red-600">{task.priority}</td>
                              <td className="py-1.5 font-mono text-[9px] uppercase font-bold text-right">{task.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedReportType === "sales" && (
              <div className="space-y-6">
                <div className="border-l-4 border-black pl-4 py-1">
                  <h3 className="text-2xl font-serif italic font-bold text-black">Sales Pipeline Audit & Funnel Ledger</h3>
                  <p className="text-xs font-serif text-black/70 mt-1">
                    Comprehensive audit statement summarizing active sales funnels, acquisition sources, won-lost ratios and individual lead valuations.
                  </p>
                </div>

                {/* Sub summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-b border-black py-4">
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">LEADS COLLECTED</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">{totalLeadsCount} records</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">WON LEADS</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">{wonLeads.length} leads</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">CONVERSION RATE</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">{winRate}% ratio</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">PIPELINE VALUE</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">
                      <PrivateText>{`$${totalPipelineValue.toLocaleString()}`}</PrivateText>
                    </p>
                  </div>
                </div>

                {/* Deep list table */}
                <div>
                  <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2 mb-3">Itemized Client Pipeline</h4>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>CLIENT / COMPANY</th>
                        <th>STAGE</th>
                        <th>ACQUISITION SOURCE</th>
                        <th>EMAIL RECTIFY</th>
                        <th className="text-right">VALUATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="font-serif italic font-semibold">
                            {lead.name}
                            <span className="block text-[10px] font-mono opacity-50 not-italic uppercase font-bold">{lead.company}</span>
                          </td>
                          <td>
                            <span className="px-1.5 py-0.5 bg-black text-white font-mono text-[9px] uppercase font-bold">
                              {lead.status}
                            </span>
                          </td>
                          <td className="font-mono text-xs uppercase">{lead.source}</td>
                          <td className="font-mono text-xs"><PrivateText>{lead.email}</PrivateText></td>
                          <td className="font-mono text-right font-bold"><PrivateText>{`$${lead.value.toLocaleString()}`}</PrivateText></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReportType === "ops" && (
              <div className="space-y-6">
                <div className="border-l-4 border-black pl-4 py-1">
                  <h3 className="text-2xl font-serif italic font-bold text-black">Operations docket & Project Delivery Audit</h3>
                  <p className="text-xs font-serif text-black/70 mt-1">
                    An operational briefing displaying current project completions, pending milestones, task priority rankings, and resource allocations.
                  </p>
                </div>

                {/* Sub summary */}
                <div className="grid grid-cols-3 gap-4 border-t border-b border-black py-4">
                  <div className="text-center">
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">TOTAL PROJECTS RECORDED</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">{totalProjectsCount}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">COMPLETED DELIVERIES</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">{completedProjects}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">ACTIVE ENGAGEMENTS</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">{activeProjects}</p>
                  </div>
                </div>

                {/* Itemized project summaries */}
                <div className="space-y-6">
                  <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2">Itemized Operations Portfolio</h4>
                  {projects.map((proj) => {
                    const completed = proj.subtasks.filter(s => s.isCompleted).length;
                    const total = proj.subtasks.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div key={proj.id} className="border border-black p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-serif italic font-extrabold text-base text-black">{proj.name}</h5>
                            <p className="text-[10px] font-mono uppercase font-bold text-black/50 mt-1">Client: {proj.contactName} | Target: {new Date(proj.deadline).toLocaleDateString()}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-black text-white font-mono text-[9px] uppercase font-bold">
                            {proj.status}
                          </span>
                        </div>
                        <p className="font-serif text-xs text-black/70 italic leading-relaxed">{proj.description}</p>
                        
                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono uppercase font-bold text-black/70">
                            <span>MILESTONES COMPLETE</span>
                            <span>{completed} OF {total} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-black/5 h-2 border border-black rounded-none overflow-hidden">
                            <div className="bg-black h-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>

                        {/* List of subtasks */}
                        <div className="pt-2 border-t border-black/5 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono uppercase">
                          {proj.subtasks.map(s => (
                            <div key={s.id} className="flex items-center gap-2">
                              <span className={`w-2 h-2 border border-black shrink-0 ${s.isCompleted ? "bg-black" : "bg-white"}`}></span>
                              <span className={s.isCompleted ? "line-through opacity-50 font-medium" : "font-bold text-black"}>{s.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedReportType === "finance" && (
              <div className="space-y-6">
                <div className="border-l-4 border-black pl-4 py-1">
                  <h3 className="text-2xl font-serif italic font-bold text-black">Financial ledger & SaaS Overhead Statement</h3>
                  <p className="text-xs font-serif text-black/70 mt-1">
                    Consolidated financial audit displaying paid and outstanding invoice liabilities paired with scheduled software subscription overheads.
                  </p>
                </div>

                {/* Sub summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-b border-black py-4">
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">PAID EARNINGS</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">
                      <PrivateText>{`$${paidInvoicesSum.toLocaleString()}`}</PrivateText>
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">SENT / OUTSTANDING</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">
                      <PrivateText>{`$${pendingInvoicesSum.toLocaleString()}`}</PrivateText>
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">OVERDUE ARREARS</span>
                    <p className="text-xl font-serif italic font-bold text-red-600 mt-0.5">
                      <PrivateText>{`$${overdueInvoicesSum.toLocaleString()}`}</PrivateText>
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold opacity-55">SaaS LIABILITY/YR</span>
                    <p className="text-xl font-serif italic font-bold text-black mt-0.5">${totalAnnualOverhead.toLocaleString()}</p>
                  </div>
                </div>

                {/* Itemized Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div>
                    <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2 mb-3">Invoice Ledger Accounts</h4>
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th>INVOICE REF</th>
                          <th>CLIENT</th>
                          <th className="text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="font-mono text-xs font-bold">
                              {inv.invoiceNumber}
                              <span className="block text-[8px] opacity-60 font-mono tracking-normal not-italic">{inv.dueDate}</span>
                            </td>
                            <td className="font-serif italic font-semibold">
                              {inv.contactName}
                              <span className="block text-[8px] font-mono uppercase tracking-widest bg-black text-white px-1 mt-0.5 w-max font-bold">{inv.status}</span>
                            </td>
                            <td className="font-mono text-right font-bold"><PrivateText>{`$${inv.amount.toLocaleString()}`}</PrivateText></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-lg font-serif italic font-bold border-b border-black pb-2 mb-3">SaaS Overhead Liabilities</h4>
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th>SOFTWARE ENTITY</th>
                          <th>CYCLE</th>
                          <th className="text-right">ANNUALIZED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub) => {
                          const annualVal = sub.billingCycle === "Monthly" ? sub.cost * 12 : sub.cost;
                          return (
                            <tr key={sub.id}>
                              <td className="font-serif italic font-semibold">
                                {sub.name}
                                <span className="block text-[8px] font-mono uppercase opacity-55 not-italic">{sub.category}</span>
                              </td>
                              <td className="font-mono text-xs uppercase">{sub.billingCycle} (${sub.cost})</td>
                              <td className="font-mono text-right font-bold">${annualVal.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* AI Executive Commentary Section */}
            {aiReportText && (
              <div className="pt-8 mt-8 border-t-2 border-dashed border-black/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-black fill-black" />
                  <h4 className="text-lg font-serif italic font-extrabold text-black uppercase tracking-tight">Boardroom Intelligence Advisory & Executive Narrative Analysis</h4>
                </div>
                <div className="font-serif text-sm text-black/85 leading-relaxed whitespace-pre-wrap text-justify bg-neutral-50/50 p-5 border border-black/20">
                  {aiReportText}
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono opacity-50 uppercase tracking-widest pt-1">
                  <span>SECURE METRIC ENGINE LOG: {aiTone.toUpperCase()} FORM</span>
                  <span>CONFIDENTIAL GENERAL ADVISORY ONLY</span>
                </div>
              </div>
            )}

            {/* 3. Report Footer & Verification Sign-off */}
            <div className="border-t-2 border-black pt-8 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-mono uppercase font-bold text-black/70">
              <div>
                <p className="opacity-55">VERIFIED RECORD DIRECTIVE</p>
                <div className="h-6 mt-4 border-b border-black/30 w-36"></div>
                <p className="text-[8px] opacity-45 mt-1">Audit Committee Officer</p>
              </div>
              <div>
                <p className="opacity-55">SYSTEM INTEGRITY SIGN-OFF</p>
                <div className="h-6 mt-4 border-b border-black/30 w-36"></div>
                <p className="text-[8px] opacity-45 mt-1">Operations Executive</p>
              </div>
              <div className="md:text-right flex flex-col justify-between">
                <span className="text-red-600 font-extrabold tracking-widest">SECURE OFFICIAL RECORD</span>
                <span className="text-[8px] opacity-40">SYSTEM IDENT: J-CRM-LNDN-2026</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
