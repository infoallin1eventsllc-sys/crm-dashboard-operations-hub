import React, { useState } from "react";
import { CRMProvider, useCRM } from "./context/CRMContext";
import { DashboardOverview } from "./components/DashboardOverview";
import { LeadsSection } from "./components/LeadsSection";
import { ContactsSection } from "./components/ContactsSection";
import { ProjectsSection } from "./components/ProjectsSection";
import { TutorialsSection } from "./components/TutorialsSection";
import { GmailSection } from "./components/GmailSection";
import { InvoicesSection } from "./components/InvoicesSection";
import { TodoBoardSection } from "./components/TodoBoardSection";
import { SubscriptionsSection } from "./components/SubscriptionsSection";
import { NotesReportsSection } from "./components/NotesReportsSection";
import { GoogleSearchFixer } from "./components/GoogleSearchFixer";
import { AICopilotWidget } from "./components/AICopilotWidget";
import { VoiceAutomationSection } from "./components/VoiceAutomationSection";
import { QuickAddModal } from "./components/QuickAddModal";
import { SystemDiagnosticsModal } from "./components/SystemDiagnosticsModal";
import { ToastContainer } from "./components/ToastContainer";
import { LoginScreen } from "./components/LoginScreen";
import {
  Plus,
  LayoutDashboard,
  Target,
  Users,
  Briefcase,
  BookOpen,
  Mail,
  FileText,
  ListTodo,
  DollarSign,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Lock,
  Unlock,
  Building,
  User,
  Activity,
  Bookmark,
  Globe,
  Search,
  Zap,
  LogOut
} from "lucide-react";

function MainAppLayout() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const { isPrivacyMode, togglePrivacyMode, isLoading, authUser, logout } = useCRM();

  // Navigation Items
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "leads", label: "Leads Funnel", icon: Target },
    { id: "contacts", label: "Client Contacts", icon: Users },
    { id: "projects", label: "Operations Projects", icon: Briefcase },
    { id: "todo", label: "Kanban Board", icon: ListTodo },
    { id: "notes", label: "Memos & Reports", icon: Bookmark },
    { id: "gmail", label: "Gmail Inbox", icon: Mail },
    { id: "invoices", label: "Manage Invoices", icon: FileText },
    { id: "subscriptions", label: "SaaS Expenses", icon: DollarSign },
    { id: "tutorials", label: "Tutorial Logs", icon: BookOpen },
    { id: "automations", label: "AI Voice & n8n", icon: Zap },
    { id: "search", label: "Google Search Fixer", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[#EDF7F4] text-[#112F24] flex flex-col lg:flex-row antialiased font-sans p-4 gap-4">
      
      {/* 1. Left Sidebar Navigation - Sleek Floating Card */}
      <aside className="w-full lg:w-64 bg-white rounded-3xl border border-[#E2F0EA] flex flex-col justify-between shrink-0 p-5 shadow-[0_8px_30px_rgba(0,172,118,0.02)]">
        
        <div className="space-y-6">
          {/* Meridian Interface Branding Header */}
          <div className="flex items-center gap-3 py-2 border-b border-[#F0F6F3]">
            <img
              src="/meridian-interface-logo.png"
              alt="Meridian Interface"
              className="w-10 h-10 rounded-xl object-contain shrink-0 shadow-[0_4px_12px_rgba(0,172,118,0.25)]"
            />
            <div>
              <h1 className="text-lg font-extrabold text-[#112F24] tracking-tight leading-none">Meridian Interface</h1>
              <span className="text-[9px] text-[#00AC76] font-bold block tracking-widest mt-1 font-mono uppercase">CRM WORKSPACE</span>
            </div>
          </div>

          {/* Quick Active Status */}
          <div className="p-3 bg-[#F8FAF9] rounded-xl border border-[#E2F0EA] flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#112F24] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#00AC76] rounded-full animate-pulse"></span>
              Workspace Synced
            </span>
            <span className="text-[9px] bg-[#E2FAF0] text-[#008A5E] font-bold px-1.5 py-0.5 rounded font-mono uppercase">Live</span>
          </div>

          {/* Persistent Sidebar Quick Add Button */}
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="w-full bg-[#00AC76] hover:bg-[#009163] text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(0,172,118,0.15)] hover:shadow-[0_6px_16px_rgba(0,172,118,0.25)]"
            id="sidebar-quick-add-btn"
          >
            <Plus size={14} className="stroke-[3]" />
            Quick Add Record
          </button>

          {/* Sidebar Navigation Menu - Grouped like the mockup */}
          <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {/* Overview Section */}
            <div>
              <p className="text-[10px] font-bold text-[#6C8E82] uppercase tracking-widest px-3 mb-1.5">Overview</p>
              <div className="space-y-1">
                {navItems.filter(i => ["overview", "projects", "leads", "notes"].includes(i.id)).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isActive 
                          ? "bg-[#E2FAF0] text-[#008A5E]" 
                          : "text-[#6C8E82] hover:text-[#112F24] hover:bg-[#F8FAF9]"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "text-[#00AC76] stroke-[2.5]" : "text-[#6C8E82]"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Section */}
            <div>
              <p className="text-[10px] font-bold text-[#6C8E82] uppercase tracking-widest px-3 mb-1.5">Business</p>
              <div className="space-y-1">
                {navItems.filter(i => ["subscriptions", "invoices", "contacts", "todo"].includes(i.id)).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isActive 
                          ? "bg-[#E2FAF0] text-[#008A5E]" 
                          : "text-[#6C8E82] hover:text-[#112F24] hover:bg-[#F8FAF9]"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "text-[#00AC76] stroke-[2.5]" : "text-[#6C8E82]"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Integrations Section */}
            <div>
              <p className="text-[10px] font-bold text-[#6C8E82] uppercase tracking-widest px-3 mb-1.5">Integrations</p>
              <div className="space-y-1">
                {navItems.filter(i => ["gmail", "automations", "search", "tutorials"].includes(i.id)).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isActive 
                          ? "bg-[#E2FAF0] text-[#008A5E]" 
                          : "text-[#6C8E82] hover:text-[#112F24] hover:bg-[#F8FAF9]"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "text-[#00AC76] stroke-[2.5]" : "text-[#6C8E82]"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Privacy Control Panel */}
        <div className="mt-6 pt-4 border-t border-[#F0F6F3] space-y-4">
          <div className="bg-[#F8FAF9] border border-[#E2F0EA] rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#112F24] uppercase">Privacy Mode</span>
              <button 
                onClick={togglePrivacyMode}
                title={isPrivacyMode ? "Disable Privacy Masking" : "Enable Screen-Share Privacy Masking"}
                className={`px-2 py-1 transition-all border rounded-lg text-[9px] uppercase font-bold cursor-pointer ${
                  isPrivacyMode 
                    ? "bg-[#FFECE8] text-[#FF5A36] border-[#FFECE8]" 
                    : "bg-white text-[#6C8E82] border-[#E2F0EA] hover:bg-[#F8FAF9]"
                }`}
              >
                {isPrivacyMode ? "Active" : "Off"}
              </button>
            </div>
            <p className="text-[9px] text-[#6C8E82] leading-normal">
              {isPrivacyMode 
                ? "Bridges active. Personal client records are redacted on screen." 
                : "Standard view. Unmasked for screen demonstration."}
            </p>
          </div>

          {/* User profile identifier */}
          <div className="flex items-center gap-2 px-1 pt-1">
            <div className="bg-[#E2FAF0] p-1.5 rounded-xl text-[#00AC76] border border-[#C2EFE0] shrink-0">
              <User size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] text-[#6C8E82] font-mono uppercase tracking-wider">CRM Administrator</p>
              <p className="text-[10px] text-[#112F24] font-semibold truncate">{authUser?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-[#6C8E82] hover:text-[#FF5A36] cursor-pointer p-1.5 rounded-lg hover:bg-[#FFECE8] transition-colors shrink-0"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>

      </aside>

      {/* 2. Main Workspace Panel - Floating Bento */}
      <main className="flex-1 flex flex-col min-w-0 gap-4">
        
        {/* Navigation / Control Header */}
        <header className="bg-white rounded-2xl border border-[#E2F0EA] px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-[0_4px_20px_rgba(0,172,118,0.01)]">
          <div className="flex items-center gap-2">
            <span className="text-[#6C8E82] font-semibold text-xs uppercase tracking-wider">Workspace Hub</span>
            <span className="text-[#E2F0EA]">/</span>
            <span className="text-[#112F24] font-bold text-sm tracking-wide">
              {navItems.find(n => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick Header Search Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("headerSearch") as HTMLInputElement;
                if (input && input.value.trim()) {
                  localStorage.setItem("global_header_search", input.value.trim());
                  setActiveTab("search");
                  window.dispatchEvent(new Event("global_header_search_trigger"));
                  input.value = "";
                }
              }}
              className="relative hidden md:flex items-center"
            >
              <input
                name="headerSearch"
                type="text"
                placeholder="Google Search & Fix..."
                className="bg-[#F8FAF9] border border-[#E2F0EA] px-4 py-1.5 rounded-xl text-xs w-52 focus:outline-hidden"
              />
              <button 
                type="submit"
                className="absolute right-3 text-[#6C8E82] hover:text-[#00AC76] cursor-pointer flex items-center"
              >
                <Search size={13} />
              </button>
            </form>

            {/* Clock display matching mockup */}
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-[#112F24]">{new Date().toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#6C8E82]">Workspace Active</p>
            </div>

            {/* Global Persistent '+' Quick Add Button */}
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="bg-[#E2FAF0] hover:bg-[#C2EFE0] text-[#008A5E] border border-[#C2EFE0] px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Quick Add Record"
              id="header-quick-add-btn"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Quick Add</span>
            </button>

            {/* System Diagnostic Check Button */}
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="bg-black hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
              title="System Diagnostic Check"
              id="header-diagnostics-btn"
            >
              <Activity size={14} className="text-emerald-400 animate-pulse" />
              <span>Diagnostics</span>
            </button>

            {/* Quick Privacy Mode Indicator Badge */}
            <button 
              onClick={togglePrivacyMode}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isPrivacyMode 
                  ? "bg-[#FFECE8] text-[#FF5A36] border-[#FFECE8]" 
                  : "bg-white text-[#6C8E82] border-[#E2F0EA] hover:bg-[#F8FAF9]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPrivacyMode ? "bg-[#FF5A36] animate-pulse" : "bg-[#6C8E82]"}`}></span>
              Privacy: {isPrivacyMode ? "ON" : "OFF"}
            </button>
          </div>
        </header>

        {/* Section View Router Body */}
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <p className="text-black text-xs font-mono uppercase tracking-wider">Establishing Database Listeners...</p>
            </div>
          ) : (
            <React.Fragment>
              {activeTab === "overview" && <DashboardOverview onNavigate={setActiveTab} />}
              {activeTab === "leads" && <LeadsSection />}
              {activeTab === "contacts" && <ContactsSection />}
              {activeTab === "projects" && <ProjectsSection />}
              {activeTab === "todo" && <TodoBoardSection />}
              {activeTab === "notes" && <NotesReportsSection />}
              {activeTab === "gmail" && <GmailSection />}
              {activeTab === "invoices" && <InvoicesSection />}
              {activeTab === "subscriptions" && <SubscriptionsSection />}
              {activeTab === "tutorials" && <TutorialsSection />}
              {activeTab === "automations" && <VoiceAutomationSection />}
              {activeTab === "search" && <GoogleSearchFixer />}
            </React.Fragment>
          )}
        </div>

        {/* Status Footer from Design HTML */}
        <footer className="h-12 border-t-2 border-black flex items-center px-8 bg-white justify-between shrink-0">
          <div className="flex gap-6 text-[9px] font-mono font-bold uppercase tracking-widest text-black/70">
            <span>Session: 08-AX-99</span>
            <span>Cloud Sync: Active</span>
            <span className="hidden sm:inline">End-to-End Encryption: ON</span>
          </div>
          <p className="text-[9px] font-mono font-bold italic text-black/50 tracking-wider">CONFIDENTIAL PROPERTY OF JOURNAL CRM SYSTEM</p>
        </footer>

      </main>

      {/* Floating Gemini AI Chief of Staff Advisor */}
      <AICopilotWidget />

      {/* Global Quick Add Record Entry Modal */}
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />

      {/* System Diagnostic Check Modal */}
      <SystemDiagnosticsModal isOpen={isDiagnosticsOpen} onClose={() => setIsDiagnosticsOpen(false)} />

      {/* Persistent global toast notification system */}
      <ToastContainer />

    </div>
  );
}

function AuthGate() {
  const { authUser, authLoading } = useCRM();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EDF7F4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00AC76] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginScreen />;
  }

  return <MainAppLayout />;
}

export default function App() {
  return (
    <CRMProvider>
      <AuthGate />
    </CRMProvider>
  );
}
