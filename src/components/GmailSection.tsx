import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  Inbox, 
  Send, 
  Sparkles, 
  Trash2, 
  Mail, 
  X, 
  Check, 
  Search, 
  ChevronRight,
  User,
  AlertCircle,
  FileCode
} from "lucide-react";

export const GmailSection: React.FC = () => {
  const { 
    gmailMessages, 
    leads, 
    contacts, 
    sendGmailMessage, 
    markEmailAsRead 
  } = useCRM();

  const [currentFolder, setCurrentFolder] = useState<"inbox" | "sent">("inbox");
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Compose fields
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // AI draft states
  const [aiDraftPrompt, setAiDraftPrompt] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiDraftError, setAiDraftError] = useState("");

  // Select a recipient from existing leads or contacts
  const handleSelectRecipient = (email: string) => {
    setToEmail(email);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail || !subject || !body) return;

    // Is it inbound or outbound?
    const isOutbound = toEmail !== "operations@crmconsulting.com";

    await sendGmailMessage({
      from: isOutbound ? "operations@crmconsulting.com" : toEmail,
      fromName: isOutbound ? "CRM Operator" : "Client Lead",
      to: toEmail,
      subject,
      body,
      isDraft: false
    });

    // Reset Composing
    setToEmail("");
    setSubject("");
    setBody("");
    setIsComposing(false);
  };

  // Generate Email Reply or Draft via Gemini
  const handleGenerateAIDraft = async () => {
    if (!aiDraftPrompt) return;
    setAiDrafting(true);
    setAiDraftError("");

    try {
      let prompt = `Write a professional, custom email based on this request: "${aiDraftPrompt}".
      The email must be polite, clear, and action-oriented.
      Sender: operations@crmconsulting.com (Operations Consultancy Desk).
      Output JSON format ONLY with:
      "subject": "Catchy Subject Line",
      "body": "Full body text of the email."`;

      if (selectedMsg) {
        prompt += `\nThis is a reply draft to an email:
        Sender of original: ${selectedMsg.from} (${selectedMsg.fromName})
        Original Subject: ${selectedMsg.subject}
        Original Body: ${selectedMsg.body}`;
      }

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Parse fields
      try {
        const text = data.text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        setSubject(parsed.subject || "Follow up from Operations Hub");
        setBody(parsed.body || text);
        setAiDraftPrompt("");
      } catch (parseErr) {
        setBody(data.text);
      }
    } catch (err: any) {
      console.error(err);
      setAiDraftError(err.message || "Failed to draft AI response.");
    } finally {
      setAiDrafting(false);
    }
  };

  const handleOpenMessage = async (msg: any) => {
    setSelectedMsg(msg);
    if (!msg.isRead && msg.to === "operations@crmconsulting.com") {
      await markEmailAsRead(msg.id);
    }
  };

  // Filter messages based on active folder and search query
  const filteredMessages = gmailMessages.filter((msg) => {
    const isInbox = msg.to === "operations@crmconsulting.com";
    const matchesFolder = currentFolder === "inbox" ? isInbox : !isInbox;

    const matchesSearch = 
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.body.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFolder && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800/60 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Mail className="text-red-500" />
            Gmail Workspace Integration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Linked Workspace Inbox: <strong className="font-mono text-slate-700 dark:text-slate-300">operations@crmconsulting.com</strong></p>
        </div>
        <button
          onClick={() => setIsComposing(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          <Mail size={16} />
          Compose Gmail
        </button>
      </div>

      {/* Main Mailbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm min-h-[500px]">
        
        {/* Sidebar Folders */}
        <div className="border-r border-slate-100 dark:border-slate-800/80 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <button
              onClick={() => { setCurrentFolder("inbox"); setSelectedMsg(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                currentFolder === "inbox" 
                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">
                <Inbox size={14} /> Inbox
              </span>
              <span className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                {gmailMessages.filter(m => !m.isRead && m.to === "operations@crmconsulting.com").length}
              </span>
            </button>
            <button
              onClick={() => { setCurrentFolder("sent"); setSelectedMsg(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                currentFolder === "sent" 
                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" 
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Send size={14} /> Sent Logs
            </button>
          </div>

          {/* Quick Contacts Linker */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">CRM Recipients Quick Link</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {leads.concat(contacts as any[]).slice(0, 6).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setIsComposing(true); setToEmail(item.email); }}
                  className="w-full text-left text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100/50 dark:hover:bg-slate-800/50 truncate flex items-center gap-1.5 font-medium"
                >
                  <User size={10} className="text-slate-400" />
                  <PrivateText type="name">{item.name}</PrivateText>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inbox message listing or detailed view */}
        <div className="lg:col-span-3 flex flex-col h-full">
          {selectedMsg ? (
            /* Detailed view */
            <div className="p-5 flex-1 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-50 dark:border-slate-850 pb-3">
                  <div>
                    <button 
                      onClick={() => setSelectedMsg(null)}
                      className="text-xs text-slate-500 hover:underline flex items-center gap-0.5 mb-2 font-medium"
                    >
                      ← Back to Mailbox
                    </button>
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{selectedMsg.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex gap-1 items-center">
                      From: <strong className="text-slate-700 dark:text-slate-300"><PrivateText type="name">{selectedMsg.fromName}</PrivateText></strong> 
                      (<span className="font-mono"><PrivateText type="email">{selectedMsg.from}</PrivateText></span>)
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(selectedMsg.date).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  {selectedMsg.body}
                </div>
              </div>

              {/* Reply Trigger inside details */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  thread: {selectedMsg.id}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setToEmail(selectedMsg.from);
                      setSubject(`Re: ${selectedMsg.subject}`);
                      setIsComposing(true);
                    }}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => setSelectedMsg(null)}
                    className="border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs px-3.5 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Inbox list and Search */
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages by subject, sender, or content keywords..."
                    className="w-full bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <Inbox size={32} className="text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No messages in folder</p>
                  <p className="text-xs text-slate-400 mt-1">Gmail threads related to leads will persist here.</p>
                </div>
              ) : (
                <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto max-h-[440px]">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`p-4 flex justify-between items-start cursor-pointer transition select-none ${
                        !msg.isRead && msg.to === "operations@crmconsulting.com" 
                          ? "bg-red-50/15 font-semibold border-l-4 border-red-500" 
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="space-y-1 pr-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-800 dark:text-slate-200 truncate">
                            <PrivateText type="name">{msg.fromName}</PrivateText>
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            <PrivateText type="email">{msg.from}</PrivateText>
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{msg.subject}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-lg">{msg.body}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                        <ChevronRight size={14} className="text-slate-300 ml-auto mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Mail className="text-red-500" size={18} />
                Compose New Email
              </h3>
              <button onClick={() => setIsComposing(false)} className="text-slate-400 hover:text-slate-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Recipient Email (To) *</label>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="e.g. client@cyberdyne.io"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Service Proposal Update"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-medium"
                />
              </div>

              {/* AI Assistant Compose Accordion */}
              <div className="bg-purple-50/40 dark:bg-purple-950/15 border border-purple-200/40 dark:border-purple-800/20 p-3 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                  <Sparkles size={12} className="animate-pulse" />
                  Gemini AI Compose Assistant
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiDraftPrompt}
                    onChange={(e) => setAiDraftPrompt(e.target.value)}
                    placeholder="e.g. Write a polite thank you note after a great demo session"
                    className="flex-1 bg-white dark:bg-slate-900 border border-purple-200/50 dark:border-purple-800/20 rounded-lg p-1.5 text-xs dark:text-slate-100"
                  />
                  <button
                    type="button"
                    disabled={aiDrafting}
                    onClick={handleGenerateAIDraft}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    {aiDrafting ? "Drafting..." : "Generate AI"}
                  </button>
                </div>
                {aiDraftError && <p className="text-[10px] text-rose-500 font-medium">{aiDraftError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Email Body *</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Draft your email message here..."
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-4">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-3 py-1.5 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Send size={12} />
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
