import React, { useState, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { 
  Search, 
  ExternalLink, 
  Globe, 
  Link as LinkIcon, 
  Cpu, 
  BookOpen, 
  Check, 
  AlertCircle,
  Copy,
  ChevronRight,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Trash2,
  Filter,
  CheckCircle2,
  Layers,
  Edit3
} from "lucide-react";

interface SearchLink {
  title: string;
  uri: string;
}

export function GoogleSearchFixer() {
  const { tutorials, updateTutorial, showToast } = useCRM();
  const [activeSubTab, setActiveSubTab] = useState<"search" | "fixer">("search");

  // Mode 1: Grounded Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [groundedLinks, setGroundedLinks] = useState<SearchLink[]>([]);
  const [executedQueries, setExecutedQueries] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Mode 2: Link Fixer Audit State
  const [selectedTutorialId, setSelectedTutorialId] = useState<string | null>(null);
  const [auditQuery, setAuditQuery] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [suggestedLinks, setSuggestedLinks] = useState<SearchLink[]>([]);
  const [auditError, setAuditError] = useState("");
  const [auditSuccessMsg, setAuditSuccessMsg] = useState("");
  
  // Filtering for SOP Registry
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<"all" | "missing" | "linked">("all");
  const [searchTutorialTerm, setSearchTutorialTerm] = useState("");
  
  // Assign modal / inline selection state from Grounded Search to SOP
  const [assigningLink, setAssigningLink] = useState<SearchLink | null>(null);
  const [assignTargetTutId, setAssignTargetTutId] = useState<string>("");

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Listen for global header search triggers
  useEffect(() => {
    const handleGlobalSearch = () => {
      const q = localStorage.getItem("global_header_search");
      if (q) {
        setSearchQuery(q);
        localStorage.removeItem("global_header_search");
        setActiveSubTab("search");
        executeSearch(q);
      }
    };

    handleGlobalSearch();

    window.addEventListener("global_header_search_trigger", handleGlobalSearch);
    return () => {
      window.removeEventListener("global_header_search_trigger", handleGlobalSearch);
    };
  }, []);

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setAiResponse("");
    setGroundedLinks([]);
    setExecutedQueries([]);

    try {
      const response = await fetch("/api/gemini/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiResponse(data.text || "No summary text generated.");
      setGroundedLinks(data.links || []);
      setExecutedQueries(data.queries || []);
    } catch (err: any) {
      console.error("Search Grounding Error:", err);
      setSearchError(err.message || "Failed to search Google via Gemini Grounding.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGroundSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const startLinkAudit = async (tutId: string, title: string, customQueryOverride?: string) => {
    setSelectedTutorialId(tutId);
    const tut = tutorials.find(t => t.id === tutId);
    setManualUrl(tut?.url || "");
    setIsAuditing(true);
    setAuditError("");
    setAuditSuccessMsg("");
    setSuggestedLinks([]);
    
    // Create a precise query to find high quality docs or SOP references
    const query = customQueryOverride || `official documentation guide reference url for "${title}"`;
    setAuditQuery(query);

    try {
      const response = await fetch("/api/gemini/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuggestedLinks(data.links || []);
      if ((data.links || []).length === 0) {
        setAuditError("No verified external URLs were found for this query. Try adjusting the query phrase.");
      }
    } catch (err: any) {
      console.error("Link Audit Error:", err);
      setAuditError(err.message || "Failed to query Google for reference links.");
    } finally {
      setIsAuditing(false);
    }
  };

  const applyLinkToTutorial = async (tutId: string, url: string) => {
    if (!tutId) return;
    try {
      await updateTutorial(tutId, { url });
      setAuditSuccessMsg("Link successfully updated in database and synchronized!");
      if (showToast) showToast("SOP reference link updated successfully!", "success");
      
      if (selectedTutorialId === tutId) {
        setManualUrl(url);
      }
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || "Failed to update database link.");
      if (showToast) showToast("Failed to update tutorial link", "error");
    }
  };

  const handleManualSaveUrl = async () => {
    if (!selectedTutorialId) return;
    await applyLinkToTutorial(selectedTutorialId, manualUrl.trim());
  };

  const handleClearUrl = async () => {
    if (!selectedTutorialId) return;
    await applyLinkToTutorial(selectedTutorialId, "");
    setManualUrl("");
  };

  const handleAssignLinkFromSearch = async () => {
    if (!assigningLink || !assignTargetTutId) return;
    await applyLinkToTutorial(assignTargetTutId, assigningLink.uri);
    setAssigningLink(null);
    setAssignTargetTutId("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Categories list
  const categories = ["All", ...Array.from(new Set(tutorials.map(t => t.category)))];

  // Filtered tutorials for Auditor list
  const filteredTutorials = tutorials.filter(t => {
    const matchesCat = filterCategory === "All" || t.category === filterCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchTutorialTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTutorialTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" ? true :
                          filterStatus === "missing" ? !t.url : !!t.url;
    return matchesCat && matchesSearch && matchesStatus;
  });

  const missingCount = tutorials.filter(t => !t.url).length;

  return (
    <div className="space-y-6" id="google-search-fixer-section">
      
      {/* Header Panel */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-black text-white text-[9px] font-mono uppercase tracking-widest font-extrabold">Grounding Hub</span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase opacity-60">Connected to Google Search & Gemini 3.6</span>
            </div>
            <h2 className="text-2xl font-serif italic font-black mt-1 text-black">Google Search Grounding & SOP Link Fixer</h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Leverage real-time Google Search engine data via Gemini to find verified documentation, resolve broken SOP reference URLs, and audit tutorial links across your CRM database.
            </p>
          </div>
          
          {/* Sub Tab Switcher */}
          <div className="flex border border-black p-1 bg-[#F4F1EA] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setActiveSubTab("search")}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                activeSubTab === "search"
                  ? "bg-black text-white"
                  : "text-black hover:bg-black/5"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Globe size={12} />
                Live Grounded Search
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab("fixer")}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                activeSubTab === "fixer"
                  ? "bg-black text-white"
                  : "text-black hover:bg-black/5"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <LinkIcon size={12} />
                SOP Link Auditor ({missingCount > 0 ? `${missingCount} unlinked` : "All OK"})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      {activeSubTab === "search" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Search Inputs Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="text-sm font-mono font-bold uppercase border-b border-black pb-2 flex items-center gap-2 text-black">
                <Search size={14} className="text-blue-600" />
                Google Query Grounding
              </h3>
              
              <form onSubmit={handleGroundSearch} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Search Query</label>
                  <textarea
                    required
                    rows={3}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Firebase rules structure for subcollections, or Tailwind CSS v4 container guide"
                    className="mt-1 w-full border border-slate-300 dark:border-slate-800 rounded-none p-2.5 text-xs bg-[#F4F1EA] font-mono leading-relaxed focus:bg-white transition-all outline-none"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-extrabold tracking-widest py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      GROUNDING...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      EXECUTE GOOGLE SEARCH
                    </>
                  )}
                </button>
              </form>

              {/* Sample Queries */}
              <div className="space-y-1.5 pt-2 border-t border-black/10">
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Suggested Prompts</p>
                {[
                  "Official Tailwind CSS v4 container configuration docs",
                  "Vite dev server port middleware-mode proxy syntax",
                  "Firebase auth custom claims security guidelines",
                  "React 19 state synchronization patterns"
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSearchQuery(q);
                      executeSearch(q);
                    }}
                    className="w-full text-left font-mono text-[9px] hover:underline text-blue-700 dark:text-blue-400 truncate block py-0.5 cursor-pointer"
                  >
                    → {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-4">
            {isSearching ? (
              <div className="bg-white border-2 border-black p-8 text-center space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-mono text-xs uppercase tracking-wider font-extrabold text-black">Querying Gemini 3.6 & Google Search Grounding Engine...</p>
                <p className="text-[10px] text-slate-500 font-mono">Fetching live web resources and verifying official documentation URLs</p>
              </div>
            ) : searchError ? (
              <div className="bg-red-50 border-2 border-red-200 p-5 text-red-800 space-y-2 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 font-extrabold uppercase">
                  <AlertCircle size={14} />
                  Search Operation Failed
                </div>
                <p>{searchError}</p>
                <p className="text-[10px] opacity-70">Verify that GEMINI_API_KEY is configured correctly in Settings.</p>
              </div>
            ) : aiResponse ? (
              <div className="space-y-4">
                
                {/* Answer Summary Card */}
                <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                  <div className="flex justify-between items-center border-b border-black/10 pb-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Cpu size={14} className="text-purple-600" />
                      Grounded AI Summary
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(aiResponse)}
                        className="text-[9px] font-mono uppercase font-bold text-slate-600 hover:text-black flex items-center gap-1 bg-[#F4F1EA] px-2 py-0.5 border border-black/20 cursor-pointer"
                      >
                        {copiedText === aiResponse ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                        {copiedText === aiResponse ? "Copied" : "Copy"}
                      </button>
                      <span className="text-[9px] font-mono uppercase bg-[#F4F1EA] px-2 py-0.5 border border-black/25 font-bold">Google Grounded</span>
                    </div>
                  </div>

                  {executedQueries.length > 0 && (
                    <div className="bg-[#F4F1EA] border border-black/15 p-2.5 text-[10px] font-mono text-slate-600 space-y-1">
                      <span className="font-bold text-black uppercase tracking-wider block text-[9px]">Google Search Queries Executed:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {executedQueries.map((q, idx) => (
                          <span key={idx} className="bg-white border border-black/20 px-2 py-0.5 rounded-none text-slate-800">
                            "{q}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="prose prose-sm max-w-none text-xs leading-relaxed font-sans whitespace-pre-wrap text-slate-800">
                    {aiResponse}
                  </div>
                </div>

                {/* Grounded URLs Card */}
                <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider border-b border-black pb-1.5 text-black flex items-center gap-1.5">
                    <Globe size={13} className="text-blue-500" />
                    Verified Google Search References ({groundedLinks.length})
                  </h4>
                  {groundedLinks.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-400">No explicit external URLs were isolated from search metadata.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groundedLinks.map((link, idx) => (
                        <div key={idx} className="p-3 border border-black bg-[#F4F1EA] flex flex-col justify-between hover:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block">Source [{idx + 1}]</span>
                            <span className="font-serif italic font-semibold text-xs text-black block line-clamp-1">{link.title || "Reference URL"}</span>
                            <span className="font-mono text-[9px] text-blue-600 truncate block">{link.uri}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-black/10 items-center justify-between">
                            <div className="flex gap-2">
                              <a
                                href={link.uri}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="text-[9px] font-mono uppercase font-extrabold text-black hover:underline flex items-center gap-0.5"
                              >
                                Open <ExternalLink size={8} />
                              </a>
                              <button
                                onClick={() => copyToClipboard(link.uri)}
                                className="text-[9px] font-mono uppercase font-extrabold text-slate-600 hover:text-black flex items-center gap-0.5 cursor-pointer"
                              >
                                {copiedText === link.uri ? "Copied!" : <>Copy <Copy size={8} /></>}
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setAssigningLink(link);
                                if (tutorials.length > 0) setAssignTargetTutId(tutorials[0].id);
                              }}
                              className="text-[9px] font-mono uppercase font-bold bg-black text-white hover:bg-neutral-800 px-2 py-0.5 flex items-center gap-1 cursor-pointer"
                            >
                              <PlusCircle size={9} /> Assign to SOP
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-[#F4F1EA] border-2 border-dashed border-black/20 rounded-none p-12 text-center">
                <Globe size={40} className="mx-auto text-black/20 mb-3" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-black">Awaiting Grounded Search Query</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1 max-w-md mx-auto">
                  Type a topic or technical query in the search pane on the left to query the Gemini Google Search grounding engine. Results can be inspected or attached directly to SOP tutorial records.
                </p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* MODE 2: SOP LINK AUDITOR */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SOP Tutorial Registry Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex justify-between items-center border-b border-black pb-2">
                <h3 className="text-sm font-mono font-bold uppercase flex items-center gap-2 text-black">
                  <BookOpen size={14} className="text-blue-500" />
                  SOP Registry ({tutorials.length})
                </h3>
                {missingCount > 0 && (
                  <span className="bg-red-100 border border-red-300 text-red-800 text-[9px] font-mono font-extrabold px-2 py-0.5 uppercase">
                    {missingCount} Unlinked
                  </span>
                )}
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Filter SOPs by title..."
                  value={searchTutorialTerm}
                  onChange={(e) => setSearchTutorialTerm(e.target.value)}
                  className="w-full border border-slate-300 p-2 text-xs font-mono bg-[#F4F1EA] focus:bg-white outline-none"
                />
                
                <div className="flex gap-1.5 text-[9px] font-mono uppercase">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`flex-1 py-1 border border-black font-bold cursor-pointer ${filterStatus === "all" ? "bg-black text-white" : "bg-white text-black"}`}
                  >
                    All ({tutorials.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus("missing")}
                    className={`flex-1 py-1 border border-black font-bold cursor-pointer ${filterStatus === "missing" ? "bg-black text-white" : "bg-white text-black"}`}
                  >
                    Missing ({missingCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus("linked")}
                    className={`flex-1 py-1 border border-black font-bold cursor-pointer ${filterStatus === "linked" ? "bg-black text-white" : "bg-white text-black"}`}
                  >
                    Linked ({tutorials.length - missingCount})
                  </button>
                </div>
              </div>
              
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredTutorials.length === 0 ? (
                  <p className="text-xs font-mono text-slate-400 p-4 text-center italic">No SOPs match your search filter.</p>
                ) : (
                  filteredTutorials.map((tut) => {
                    const hasLink = !!tut.url;
                    const isSelected = selectedTutorialId === tut.id;
                    return (
                      <div 
                        key={tut.id}
                        onClick={() => startLinkAudit(tut.id, tut.title)}
                        className={`p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? "bg-black text-white border-black" 
                            : "bg-[#F4F1EA] hover:bg-white border-black/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <span className={`text-[8px] font-mono uppercase px-1 py-0.5 rounded font-bold ${
                              isSelected ? "bg-white text-black" : "bg-black text-white"
                            }`}>
                              {tut.category}
                            </span>
                            <span className="font-mono text-[9px]">
                              {hasLink ? (
                                <span className={`font-extrabold flex items-center gap-0.5 ${isSelected ? "text-green-300" : "text-green-600"}`}>
                                  <Check size={8} /> Verified Link
                                </span>
                              ) : (
                                <span className={`font-bold ${isSelected ? "text-red-300" : "text-red-500"}`}>
                                  No Reference Link
                                </span>
                              )}
                            </span>
                          </div>
                          <h4 className="font-serif italic font-semibold text-xs leading-tight">{tut.title}</h4>
                          {tut.url && (
                            <p className={`text-[9px] font-mono truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                              {tut.url}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/15 text-[9px] font-mono uppercase font-bold">
                          <span>Audit & Fix Link</span>
                          <ChevronRight size={10} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Audit Result and Suggestions Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTutorialId ? (
              <div className="space-y-4">
                
                {/* Selected Tutorial Header & Manual Override */}
                <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                  <div className="flex justify-between items-start border-b border-black/10 pb-2">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Target SOP Tutorial Record</span>
                      <h3 className="font-serif italic font-black text-lg text-black">
                        {tutorials.find(t => t.id === selectedTutorialId)?.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">
                        {tutorials.find(t => t.id === selectedTutorialId)?.description}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedTutorialId(null)}
                      className="text-xs font-mono font-bold uppercase underline decoration-2 hover:opacity-75 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  {/* Manual URL Input / Current URL Controls */}
                  <div className="space-y-2 bg-[#F4F1EA] border border-black/15 p-3">
                    <label className="block text-[10px] font-mono font-bold text-black uppercase tracking-wider flex items-center justify-between">
                      <span>Assigned Reference URL</span>
                      {tutorials.find(t => t.id === selectedTutorialId)?.url ? (
                        <span className="text-green-600 font-extrabold flex items-center gap-1 text-[9px]">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold text-[9px]">Unlinked</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://docs.example.com/guide..."
                        className="flex-1 border border-black/30 p-2 text-xs font-mono bg-white focus:outline-none"
                      />
                      <button
                        onClick={handleManualSaveUrl}
                        className="bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-extrabold px-3 py-2 cursor-pointer shrink-0"
                      >
                        Save Link
                      </button>
                      {manualUrl && (
                        <button
                          onClick={handleClearUrl}
                          className="bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 font-mono text-xs font-bold px-2.5 py-2 cursor-pointer shrink-0"
                          title="Remove URL"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Custom Search Query Box */}
                  <div className="p-3 bg-white border border-black text-xs font-mono text-slate-700 space-y-2">
                    <label className="font-bold text-black uppercase text-[9px] tracking-wider block">
                      Google Grounding Search Query Phrase:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={auditQuery}
                        onChange={(e) => setAuditQuery(e.target.value)}
                        className="flex-1 border border-slate-300 p-2 text-xs font-mono bg-[#F4F1EA]"
                      />
                      <button
                        onClick={() => {
                          const tut = tutorials.find(t => t.id === selectedTutorialId);
                          if (tut) startLinkAudit(tut.id, tut.title, auditQuery);
                        }}
                        disabled={isAuditing}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold px-3 py-2 flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isAuditing ? "animate-spin" : ""} />
                        Re-Search
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit Status or Action Results */}
                {isAuditing ? (
                  <div className="bg-white border-2 border-black p-8 text-center space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-mono text-xs uppercase tracking-wider font-extrabold text-black">Searching Google for Official Docs & Reference Links...</p>
                    <p className="text-[10px] text-slate-500 font-mono">Cross-referencing indices with Gemini 3.6 AI Search</p>
                  </div>
                ) : auditError ? (
                  <div className="bg-red-50 border-2 border-red-200 p-5 text-red-800 space-y-2 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 font-extrabold uppercase">
                      <AlertCircle size={14} />
                      Audit Search Failed
                    </div>
                    <p>{auditError}</p>
                    <button 
                      onClick={() => {
                        const tut = tutorials.find(t => t.id === selectedTutorialId);
                        if (tut) startLinkAudit(tut.id, tut.title);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-3 py-1 mt-1 text-[10px] uppercase border border-red-300 cursor-pointer"
                    >
                      Retry Default Search
                    </button>
                  </div>
                ) : auditSuccessMsg ? (
                  <div className="bg-green-50 border-2 border-green-200 p-5 text-green-800 space-y-2 font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 font-extrabold uppercase">
                      <Check size={14} />
                      Link Synchronized
                    </div>
                    <p>{auditSuccessMsg}</p>
                  </div>
                ) : null}

                {suggestedLinks.length > 0 && (
                  <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider border-b border-black pb-1.5 text-black flex items-center gap-1.5">
                      <Globe size={13} className="text-blue-500" />
                      Suggested Reference Links from Google Search ({suggestedLinks.length})
                    </h4>
                    
                    <p className="text-[10px] font-mono text-slate-500 leading-normal">
                      Google Search returned these verified documentation links. Select one to automatically assign it as the primary resource URL for this SOP.
                    </p>

                    <div className="space-y-3 pt-2">
                      {suggestedLinks.map((link, idx) => {
                        const isCurrentUrl = tutorials.find(t => t.id === selectedTutorialId)?.url === link.uri;
                        return (
                          <div 
                            key={idx} 
                            className="p-3 border border-black bg-[#F4F1EA] hover:bg-white transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="font-serif italic font-semibold text-xs text-black block line-clamp-1">{link.title || "Reference Guide"}</span>
                              <span className="font-mono text-[9px] text-blue-600 truncate block">{link.uri}</span>
                            </div>
                            
                            <div className="flex gap-2 shrink-0">
                              <a
                                href={link.uri}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="px-2.5 py-1.5 border border-black text-[9px] font-mono uppercase font-bold bg-white text-black hover:bg-neutral-50 flex items-center gap-0.5"
                              >
                                View <ExternalLink size={8} />
                              </a>
                              <button
                                onClick={() => applyLinkToTutorial(selectedTutorialId, link.uri)}
                                disabled={isCurrentUrl}
                                className={`px-2.5 py-1.5 text-[9px] font-mono uppercase font-extrabold text-white transition-all flex items-center gap-0.5 cursor-pointer ${
                                  isCurrentUrl
                                    ? "bg-green-600 opacity-80 cursor-not-allowed"
                                    : "bg-black hover:bg-neutral-800"
                                }`}
                              >
                                {isCurrentUrl ? (
                                  <>
                                    <Check size={9} /> Assigned
                                  </>
                                ) : (
                                  "Assign Link"
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-[#F4F1EA] border-2 border-dashed border-black/20 rounded-none p-12 text-center">
                <LinkIcon size={40} className="mx-auto text-black/20 mb-3" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-black">Awaiting Tutorial SOP Selection</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1 max-w-md mx-auto">
                  Select any tutorial document from the SOP Registry on the left. The auditor will analyze the topic, execute a live Google Search, and present verified official documentation links to populate or repair the SOP.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal for Assigning Link from Search tab to SOP */}
      {assigningLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-6 max-w-md w-full space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-base font-serif italic font-black text-black border-b border-black pb-2">
              Assign Grounded Reference Link
            </h3>
            <div className="p-3 bg-[#F4F1EA] border border-black/20 text-xs font-mono space-y-1">
              <span className="font-bold block text-black line-clamp-1">{assigningLink.title}</span>
              <span className="text-[10px] text-blue-600 block truncate">{assigningLink.uri}</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                Select Target SOP / Tutorial
              </label>
              <select
                value={assignTargetTutId}
                onChange={(e) => setAssignTargetTutId(e.target.value)}
                className="w-full border border-black p-2 text-xs font-mono bg-white"
              >
                {tutorials.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.url ? "Has link" : "No link"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAssigningLink(null)}
                className="flex-1 bg-slate-100 border border-black hover:bg-slate-200 text-black font-mono text-xs uppercase font-bold py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignLinkFromSearch}
                className="flex-1 bg-black hover:bg-neutral-800 text-white font-mono text-xs uppercase font-extrabold py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Assign URL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
