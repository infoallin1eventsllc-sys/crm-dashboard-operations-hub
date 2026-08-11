import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  X, 
  ExternalLink, 
  FileText, 
  Folder,
  Globe,
  PlusCircle,
  Clock,
  Search,
  Lock,
  Unlock
} from "lucide-react";

export const TutorialsSection: React.FC = () => {
  const { 
    tutorials, 
    addTutorial, 
    updateTutorial, 
    deleteTutorial 
  } = useCRM();

  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<any>("All");
  
  // Search & Secure Staff SOP login states
  const [searchQuery, setSearchQuery] = useState("");
  const [isStaffSopUnlocked, setIsStaffSopUnlocked] = useState(false);
  const [sopPasswordInput, setSopPasswordInput] = useState("");
  const [sopLoginError, setSopLoginError] = useState("");
  
  // Add Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<any>("Development");
  const [status, setStatus] = useState<any>("Published");

  // Gemini AI Ideation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Tutorial Viewing Modal
  const [readingTutorial, setReadingTutorial] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await addTutorial({
      title,
      description,
      content,
      url,
      category,
      status
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setCategory("Development");
    setStatus("Published");
    setIsAdding(false);
  };

  // Generate Tutorial Topic Ideas with Gemini
  const generateTutorialIdeas = async () => {
    setAiGenerating(true);
    setAiError("");
    setAiSuggestions([]);

    try {
      const prompt = `Generate 3 modern, highly relevant tutorial topic ideas for a tech operations consultancy or CRM.
      The topics should target small businesses wanting to automate processes, secure databases (Firebase), manage pipelines, or implement screen privacy tools.
      
      Output JSON format ONLY as an array of objects:
      [
        {
          "title": "Tutorial Title Here",
          "description": "Short 1-2 sentence overview of what the reader learns.",
          "category": "Development" or "Design" or "Marketing" or "Sales" or "Operations",
          "outline": "Quick bullet-point outline of contents."
        }
      ]`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Parse array
      try {
        const text = data.text.trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        setAiSuggestions(parsed);
      } catch (parseErr) {
        throw new Error("Could not parse JSON response from Gemini. Let's retry.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to generate AI tutorial suggestions.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseSuggestion = (sug: any) => {
    setTitle(sug.title);
    setDescription(sug.description);
    setCategory(sug.category);
    setContent(`# ${sug.title}\n\n## Overview\n${sug.description}\n\n## Syllabus Outline\n${sug.outline || "1. Prerequisites\\n2. Implementation\\n3. Deployment"}`);
    setIsAdding(true);
    setAiSuggestions([]);
  };

  const handleSopLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (sopPasswordInput === "admin" || sopPasswordInput === "1234") {
      setIsStaffSopUnlocked(true);
      setSopPasswordInput("");
      setSopLoginError("");
    } else {
      setSopLoginError("Invalid PIN! Try 'admin' or '1234'.");
    }
  };

  const filteredTutorials = tutorials.filter(tut => {
    // 1. Tab category filter
    if (activeTab !== "All" && tut.category !== activeTab) return false;
    
    // 2. Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        tut.title.toLowerCase().includes(q) || 
        (tut.description || "").toLowerCase().includes(q) || 
        (tut.content || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tutorial Resources & Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage learning assets, document SOPs, and brainstorm topics with Gemini</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateTutorialIdeas}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Sparkles size={16} />
            AI Topic Brainstorm
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0"
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
            {isAdding ? "Cancel" : "Log Tutorial"}
          </button>
        </div>
      </div>

      {/* AI Suggestions Box */}
      {aiGenerating && (
        <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/20 p-5 rounded-xl text-center space-y-3">
          <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Gemini is brainstorming tutorial topics...</p>
        </div>
      )}

      {aiError && (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-xl text-xs">
          <strong>Brainstorm Error:</strong> {aiError}
        </div>
      )}

      {aiSuggestions.length > 0 && (
        <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-200/30 dark:border-purple-800/20 p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-purple-100 dark:border-purple-900 pb-2">
            <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5 text-sm">
              <Sparkles size={16} />
              Gemini AI Recommended Topics
            </h3>
            <button onClick={() => setAiSuggestions([])} className="text-purple-500 hover:text-purple-700">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiSuggestions.map((sug, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {sug.category}
                  </span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2">{sug.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{sug.description}</p>
                </div>
                <button
                  onClick={() => handleUseSuggestion(sug)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1"
                >
                  <PlusCircle size={12} /> Use Topic Draft
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Tutorial Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-4">
            <BookOpen size={18} className="text-blue-500" />
            Document Operational Resource / Tutorial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Tutorial Title *</label>
              <input 
                type="text" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Setting Up Firebase Firestore Listeners"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Short Summary Description</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly state the goal of this tutorial (SOP)."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">External Tutorial Link (optional)</label>
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/tutorials/firebase"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase">SOP Markdown Content (Drafting Pad)</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="# Setup SOP Instructions..."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-600">
                <input 
                  type="checkbox" 
                  checked={status === "Published"} 
                  onChange={(e) => setStatus(e.target.checked ? "Published" : "Draft")}
                  className="rounded border-slate-300"
                />
                Mark as Published immediately
              </label>
            </div>
            <div className="flex gap-2">
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
                Log Post
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Categories filter tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/60 pb-px">
        {["All", "Development", "Design", "Marketing", "Sales", "Operations"].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition -mb-px shrink-0 ${
              activeTab === cat 
                ? "border-slate-950 text-slate-900 dark:border-slate-100 dark:text-slate-100" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Secure Staff SOP login block */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operational tutorials or SOP content..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs font-medium dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Staff SOP credentials lock widget */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {isStaffSopUnlocked ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 border border-emerald-100 dark:border-emerald-900/40 rounded-lg">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Secure Staff Mode Active</span>
              <button
                type="button"
                onClick={() => setIsStaffSopUnlocked(false)}
                className="text-slate-400 hover:text-slate-600 underline font-semibold ml-2"
              >
                Lock
              </button>
            </div>
          ) : (
            <form onSubmit={handleSopLogin} className="flex items-center gap-2 text-xs w-full md:w-auto">
              <span className="text-slate-450 text-[10px] uppercase font-bold tracking-wider hidden sm:inline text-slate-500">Secure SOP Lock:</span>
              <div className="relative flex items-center">
                <input
                  type="password"
                  value={sopPasswordInput}
                  onChange={(e) => {
                    setSopPasswordInput(e.target.value);
                    setSopLoginError("");
                  }}
                  placeholder="PIN: 'admin' or '1234'"
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-[11px] font-mono focus:outline-hidden w-40"
                />
              </div>
              <button
                type="submit"
                className="bg-slate-950 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-mono text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg transition shrink-0 cursor-pointer"
              >
                Unlock
              </button>
            </form>
          )}
        </div>
      </div>

      {sopLoginError && (
        <div className="text-red-500 text-[11px] font-semibold text-right -mt-4 mr-2 animate-pulse">
          {sopLoginError}
        </div>
      )}

      {/* Tutorials Grid */}
      {filteredTutorials.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl py-12 text-center">
          <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">No tutorial logs registered in this category.</p>
          <p className="text-xs text-slate-400 mt-1">SOP guidelines or recorded video logs will persist here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredTutorials.map((tut) => (
            <div 
              key={tut.id} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                    tut.category === "Development" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" :
                    tut.category === "Design" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" :
                    tut.category === "Marketing" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                    tut.category === "Sales" ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" :
                    "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {tut.category}
                  </span>
                  <div className="flex gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      tut.status === "Published" 
                        ? "border-emerald-200 text-emerald-800 bg-emerald-50/50 dark:border-emerald-950 dark:text-emerald-300" 
                        : "border-slate-200 text-slate-500"
                    }`}>
                      {tut.status}
                    </span>
                    <button
                      onClick={() => { if(confirm("Permanently delete tutorial record?")) deleteTutorial(tut.id); }}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1 leading-snug flex items-center gap-1.5">
                  {(tut.category === "Operations" || tut.title.toLowerCase().includes("confidential") || tut.title.toLowerCase().includes("sop")) && (
                    <Lock size={12} className={isStaffSopUnlocked ? "text-emerald-500" : "text-amber-500"} />
                  )}
                  {tut.title}
                </h3>
                
                {(tut.category === "Operations" || tut.title.toLowerCase().includes("confidential") || tut.title.toLowerCase().includes("sop")) && !isStaffSopUnlocked ? (
                  <p className="text-xs text-slate-400 italic blur-xs select-none">
                    Confidential Operations SOP. Unlock to read description.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {tut.description || "No description logged."}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 mt-4 flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-mono">
                  {new Date(tut.createdAt).toLocaleDateString()}
                </span>
                
                <div className="flex gap-2">
                  {(tut.category === "Operations" || tut.title.toLowerCase().includes("confidential") || tut.title.toLowerCase().includes("sop")) && !isStaffSopUnlocked ? (
                    <button 
                      type="button"
                      onClick={() => {
                        setSopLoginError("Please enter the security PIN 'admin' or '1234' above to unlock Confidential SOPs.");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-amber-600 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <Lock size={10} /> Unlock SOP
                    </button>
                  ) : (
                    <>
                      {tut.content && (
                        <button 
                          onClick={() => setReadingTutorial(tut)}
                          className="text-blue-500 hover:underline font-bold"
                        >
                          Read SOP
                        </button>
                      )}
                      {tut.url && (
                        <a 
                          href={tut.url} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          className="text-slate-500 hover:text-slate-700 flex items-center gap-0.5 font-bold"
                        >
                          Link <ExternalLink size={10} />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tutorial Detail SOP Reader Modal */}
      {readingTutorial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 max-w-xl w-full shadow-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-50 pb-2">
              <div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {readingTutorial.category} SOP Document
                </span>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mt-1">
                  {readingTutorial.title}
                </h3>
              </div>
              <button onClick={() => setReadingTutorial(null)} className="text-slate-400 hover:text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 max-h-96 overflow-y-auto border border-slate-100 dark:border-slate-850">
              {readingTutorial.content || "# No written documentation content. Double click edit to compose SOP details."}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-50">
              <span className="font-mono">Created: {new Date(readingTutorial.createdAt).toLocaleString()}</span>
              <button 
                onClick={() => setReadingTutorial(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded-lg text-xs"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
