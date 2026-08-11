import React, { useState, useRef, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  ChevronDown, 
  Bot, 
  Copy, 
  Check, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  Minimize2,
  Maximize2
} from "lucide-react";
import { PrivateText } from "./PrivateText";

interface Message {
  sender: "user" | "gemini";
  text: string;
  timestamp: Date;
}

export const AICopilotWidget: React.FC = () => {
  const { 
    leads, 
    contacts, 
    projects, 
    invoices, 
    subscriptions, 
    todoTasks, 
    meetEvents 
  } = useCRM();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "gemini",
      text: "Good day, Director. I am your Gemini Chief of Staff. I have indexed your real-time CRM database. Ask me to perform a high-level health audit, write strategic drafts, or analyze pipeline burn rate.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Executive suggested instant questions
  const suggestions = [
    { label: "📊 Performance Audit", prompt: "Perform a high-level corporate performance and cashflow audit of our CRM data." },
    { label: "🎯 Pipeline Analysis", prompt: "Analyze current lead pipeline quality and highlight top high-value prospects." },
    { label: "💡 Expense Reduction", prompt: "Analyze SaaS expenses and active subscriptions. Suggest strategic cost-saving opportunities." },
    { label: "⚡ Executive Brief", prompt: "Draft a concise executive briefing summarizing active client projects and overdue deliverables." }
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // Assemble dynamic CRM state as context to Gemini
      const activeLeads = leads.filter(l => ["New", "Contacted", "Qualified", "Proposal"].includes(l.status));
      const totalPipelineValue = activeLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      const activeProjects = projects.filter(p => p.status !== "Completed");
      const unpaidInvoices = invoices.filter(i => ["Sent", "Overdue"].includes(i.status));
      const overdueInvoices = invoices.filter(i => i.status === "Overdue");
      const activeSubs = subscriptions.filter(s => s.status === "Active");
      
      const crmContext = `
      --- CRM DATABASE REAL-TIME STATE ---
      [LEADS PIPELINE]
      - Total active leads count: ${activeLeads.length}
      - Total cumulative pipeline value: $${totalPipelineValue.toLocaleString()}
      - Details: ${JSON.stringify(activeLeads.map(l => ({ name: l.name, company: l.company, value: l.value, status: l.status })))}

      [CLIENT DIRECTORY]
      - Total registered contacts: ${contacts.length}
      - Core client list summary: ${JSON.stringify(contacts.slice(0, 10).map(c => ({ name: c.name, company: c.company, role: c.role })))}

      [PROJECT DELIVERABLES]
      - Active projects count: ${activeProjects.length}
      - Details: ${JSON.stringify(activeProjects.map(p => ({ name: p.name, client: p.contactName, status: p.status, progress: p.subtasks && p.subtasks.length > 0 ? `${Math.round((p.subtasks.filter(s => s.isCompleted).length / p.subtasks.length) * 100)}%` : "0%" })))}

      [INVOICING LEDGER]
      - Unpaid invoice count: ${unpaidInvoices.length}
      - Total unpaid sum: $${unpaidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0).toLocaleString()}
      - Overdue invoices: ${JSON.stringify(overdueInvoices.map(i => ({ client: i.contactName, amount: i.amount, dueDate: i.dueDate })))}

      [SAAS SUBSCRIPTIONS]
      - Active SaaS systems: ${activeSubs.length}
      - Top items: ${JSON.stringify(activeSubs.map(s => ({ name: s.name, cost: s.cost, cycle: s.billingCycle })))}

      [OPERATIONAL TASKS]
      - Total pending task log count: ${todoTasks.filter(t => t.status !== "Done").length}
      - High priority pending tasks: ${JSON.stringify(todoTasks.filter(t => t.status !== "Done" && t.priority === "High").map(t => t.title))}

      [CLIENT BRIEFINGS / MEETINGS]
      - Upcoming schedule: ${JSON.stringify(meetEvents.slice(0, 5).map(m => ({ title: m.title, contact: m.contactName, date: m.date, time: m.time })))}
      ------------------------------------
      `;

      const prompt = `You are the Gemini CRM Virtual Chief of Staff, an elite corporate executive strategist analyzing real-time financial and client operations data for 'All In 1 Events & Operations Consultancy'. 
      Your reader is a high-level Director or Board Member. You must respond with extreme professional poise, authority, and analytical precision.

      Here is the real-time state of the company's ledger and client operations database:
      ${crmContext}

      User's query: "${textToSend}"

      Guidelines:
      1. Always speak with real numbers, specific client names, and data from the provided database.
      2. Keep responses highly organized with elegant bullet formatting, bold headers, and crisp paragraphs.
      3. For strategy, list high-impact recommendations. For drafting, provide immediate ready-to-send copy.
      4. Highlight financial metrics clearly. Use professional, elite executive tone (Swiss modern advisory style).
      5. Output plain narrative or neat markdown. Do NOT use code blocks or markdown blocks unless writing email template codes. Just output text.`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        sender: "gemini",
        text: data.text || "I apologize, Director. I could not synthesize that dataset. Please try again.",
        timestamp: new Date()
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: "gemini",
        text: `Error connecting to analytical core: ${err.message || "Operation timed out."} Please verify your GEMINI_API_KEY.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print font-sans">
      
      {/* Floating Sparkles Bubble Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black hover:bg-neutral-900 text-white rounded-full p-4 shadow-2xl flex items-center gap-2 hover:scale-105 transition-all border-2 border-black duration-300 relative cursor-pointer"
          id="ai-copilot-bubble-trigger"
        >
          <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider pr-1">AI Chief of Staff</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
          </span>
        </button>
      )}

      {/* Slide-out / Floating Executive Chat Window */}
      {isOpen && (
        <div className={`bg-[#F4F1EA] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col transition-all duration-300 ${
          isMinimized 
            ? "w-80 h-14" 
            : "w-[420px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-100px)]"
        }`}>
          
          {/* Executive Header Bar */}
          <div className="bg-black text-[#F4F1EA] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-serif italic font-bold tracking-tight">Gemini CRM Chief of Staff</h4>
                <p className="text-[8px] font-mono uppercase tracking-widest text-[#F4F1EA]/75">Virtual Executive Advisor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-[#F4F1EA]/70 hover:text-[#F4F1EA] p-1 rounded transition"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[#F4F1EA]/70 hover:text-[#F4F1EA] p-1 rounded transition cursor-pointer"
                title="Close Advisor"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Chat Panel Body (Hidden when minimized) */}
          {!isMinimized && (
            <React.Fragment>
              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F5]">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[8px] font-mono text-black/45 uppercase tracking-wider mb-1">
                      {msg.sender === "user" ? "Director Log" : "Gemini Chief of Staff"}
                    </span>
                    
                    <div className={`p-3 border text-xs leading-relaxed font-serif whitespace-pre-wrap ${
                      msg.sender === "user" 
                        ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]" 
                        : "bg-white text-black border-black/15 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                    }`}>
                      {msg.text}

                      {/* Copy Helper for AI response text */}
                      {msg.sender === "gemini" && (
                        <div className="mt-2.5 pt-2 border-t border-black/5 flex justify-end">
                          <button
                            onClick={() => handleCopy(msg.text)}
                            className="text-[9px] font-mono uppercase font-bold text-black/50 hover:text-black flex items-center gap-1 cursor-pointer"
                          >
                            {copiedText === msg.text ? (
                              <>
                                <Check size={10} className="text-emerald-600" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={9} />
                                <span>Copy Analysis</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-black/60 italic p-1">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                    </span>
                    <span>Synthesizing corporate database insights...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Instant suggestions deck (Only if no custom chat history yet or as continuous support) */}
              <div className="bg-white border-t border-black/10 px-3 py-2.5 space-y-1.5">
                <p className="text-[8px] font-mono uppercase tracking-wider text-black/50 px-1 font-bold">Suggested Corporate Briefs</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s.prompt)}
                      disabled={isLoading}
                      className="text-[10px] font-mono border border-black/20 hover:border-black bg-neutral-50 hover:bg-neutral-100 text-black px-2 py-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer Footer */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputText);
                }}
                className="p-3 border-t-2 border-black flex items-center gap-2 bg-[#F4F1EA] shrink-0"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask advisor (e.g. 'Audit active pipeline')"
                  disabled={isLoading}
                  className="flex-1 bg-white border border-black px-3 py-2 text-xs font-mono focus:outline-hidden placeholder:text-black/30"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white px-3 py-2 border border-black transition cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send size={13} />
                </button>
              </form>
            </React.Fragment>
          )}

        </div>
      )}

    </div>
  );
};
