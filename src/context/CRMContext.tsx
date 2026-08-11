import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  writeBatch
} from "firebase/firestore";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";
import { db, auth } from "../firebase";
import { 
  Lead, 
  Contact, 
  Project, 
  TutorialPost, 
  Invoice, 
  Subscription, 
  TodoTask, 
  ActivityLog, 
  GmailMessage, 
  MeetEvent,
  QuickNote,
  FinancialTransaction
} from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  timestamp: number;
}

interface CRMContextType {
  leads: Lead[];
  contacts: Contact[];
  projects: Project[];
  tutorials: TutorialPost[];
  invoices: Invoice[];
  subscriptions: Subscription[];
  todoTasks: TodoTask[];
  activityLogs: ActivityLog[];
  gmailMessages: GmailMessage[];
  meetEvents: MeetEvent[];
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  isLoading: boolean;
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addContact: (contact: Omit<Contact, "id" | "createdAt">) => Promise<void>;
  bulkAddContacts: (contactsList: Omit<Contact, "id" | "createdAt">[]) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt">) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTutorial: (tutorial: Omit<TutorialPost, "id" | "createdAt">) => Promise<void>;
  updateTutorial: (id: string, tutorial: Partial<TutorialPost>) => Promise<void>;
  deleteTutorial: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addSubscription: (sub: Omit<Subscription, "id" | "createdAt">) => Promise<void>;
  updateSubscription: (id: string, sub: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  addTodoTask: (task: Omit<TodoTask, "id" | "createdAt">) => Promise<void>;
  updateTodoTask: (id: string, task: Partial<TodoTask>) => Promise<void>;
  deleteTodoTask: (id: string) => Promise<void>;
  addActivityLog: (type: ActivityLog["type"], action: string, description: string) => Promise<void>;
  clearActivityLogs: () => Promise<void>;
  sendGmailMessage: (msg: Omit<GmailMessage, "id" | "date" | "isRead">) => Promise<void>;
  markEmailAsRead: (id: string) => Promise<void>;
  scheduleMeet: (meet: Omit<MeetEvent, "id" | "createdAt" | "meetLink">) => Promise<void>;
  deleteMeetEvent: (id: string) => Promise<void>;
  quickNotes: QuickNote[];
  addQuickNote: (note: Omit<QuickNote, "id" | "createdAt">) => Promise<void>;
  updateQuickNote: (id: string, note: Partial<QuickNote>) => Promise<void>;
  deleteQuickNote: (id: string) => Promise<void>;
  financialTransactions: FinancialTransaction[];
  addFinancialTransaction: (tx: Omit<FinancialTransaction, "id" | "createdAt">) => Promise<void>;
  deleteFinancialTransaction: (id: string) => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
  authUser: User | null;
  authLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Helper to generate IDs when falling back to memory/local
const generateId = () => Math.random().toString(36).substring(2, 11);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tutorials, setTutorials] = useState<TutorialPost[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [todoTasks, setTodoTasks] = useState<TodoTask[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [meetEvents, setMeetEvents] = useState<MeetEvent[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Owner-only auth gate. The app has a single admin user (see firestore.rules,
  // which restricts reads/writes to this same account) - there is no self-serve
  // sign-up flow, by design.
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Google sign-in is used instead of email/password because the Firebase
  // project this app runs in (an AI Studio-provisioned project) restricts
  // enabling the Email/Password provider to project owners. Google sign-in
  // was already enabled by default, so no Firebase Console changes are
  // needed - firestore.rules still gates access by the signed-in email.
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("crm_privacy_mode");
    return saved === "true";
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [useFirebaseFallback, setUseFirebaseFallback] = useState<boolean>(false);
  // Tracks which Firestore collections have already received at least one snapshot,
  // so demo data is only ever seeded once per collection (see handleSync below).
  const seededCollectionsRef = useRef<Set<string>>(new Set());

  // Toggle privacy mode
  const togglePrivacyMode = () => {
    setIsPrivacyMode(prev => {
      const next = !prev;
      localStorage.setItem("crm_privacy_mode", String(next));
      return next;
    });
  };

  // Seed default data if needed
  const seedDefaultData = async (forceLocal = false) => {
    const initialLeads: Omit<Lead, "id" | "createdAt">[] = [
      { name: "Johnathan Miller", email: "john@cyberdyne.io", phone: "+1 (555) 124-5892", company: "Cyberdyne Systems", value: 12500, status: "Proposal", source: "Inbound Email", notes: "Interested in the enterprise operations consulting pack." },
      { name: "Sarah Connor", email: "sarah@resistance.net", phone: "+1 (555) 987-1102", company: "The Resistance", value: 45000, status: "Qualified", source: "Referral", notes: "Looking for advanced cybersecurity training protocols." },
      { name: "Marcus Wright", email: "marcus@projectangel.com", phone: "+1 (555) 432-8899", company: "Project Angel", value: 8500, status: "New", source: "Web Form", notes: "Needs system architectural review for their new platform." },
      { name: "Kate Brewster", email: "kate@defense.gov", phone: "+1 (555) 606-2029", company: "CRS Defense", value: 95000, status: "Contacted", source: "Cold Call", notes: "Government operations bid. Keep communication formal." }
    ];

    const initialContacts: Omit<Contact, "id" | "createdAt">[] = [
      { name: "Dr. Miles Dyson", email: "dyson@cyberdyne.io", phone: "+1 (555) 124-5000", company: "Cyberdyne Systems", role: "Director of R&D", notes: "Key decision maker for operations consulting project." },
      { name: "John Connor", email: "john.connor@resistance.net", phone: "+1 (555) 987-1111", company: "The Resistance", role: "Commander", notes: "Primary technical and logistics contact." }
    ];

    const initialProjects: Omit<Project, "id" | "createdAt">[] = [
      { name: "Operations Architecture Upgrade", contactName: "Dr. Miles Dyson", status: "In Progress", value: 12500, deadline: "2026-08-15", description: "Re-platforming and cloud auditing of Cyberdyne corporate architecture.", subtasks: [
        { id: "s1", title: "Audit local storage databases", isCompleted: true },
        { id: "s2", title: "Migrate auth services to cloud", isCompleted: false },
        { id: "s3", title: "Establish security firewalls", isCompleted: false }
      ]},
      { name: "Logistics Training Module", contactName: "John Connor", status: "Planning", value: 45000, deadline: "2026-10-01", description: "Developing simulation tutorials and training materials.", subtasks: [
        { id: "p1", title: "Draft learning curriculum", isCompleted: false },
        { id: "p2", title: "Record initial video lectures", isCompleted: false }
      ]}
    ];

    const initialTutorials: Omit<TutorialPost, "id" | "createdAt">[] = [
      { title: "Building Full-Stack Applets with React & Firebase", description: "A comprehensive guide on managing states, syncing Collections, and designing robust secure rules.", content: "# Full-Stack Applet Sync\n\nIn this tutorial we discuss...\n1. Setup firebase\n2. Stream collections\n3. Fallback gracefully", url: "https://example.com/tutorials/firebase-sync", category: "Development", status: "Published" },
      { title: "Zero-Trust CRM Client Privacy Best Practices", description: "Learn how to build visual mask filters and interactive blurring tools in your corporate dashboard.", content: "# Secure Client Views\n\nTo blur numbers and names:\n- Define CSS blur\n- Toggle hook states\n- Provide safe hover reveals", url: "https://example.com/tutorials/privacy-mode", category: "Design", status: "Published" },
      { title: "Optimizing Outbound Lead Pipeline Funnels", description: "Strategies for converting cold outreach leads into high-ticket proposals.", content: "# Pipeline Conversions\n\nOutline of winning emails...", url: "", category: "Sales", status: "Draft" }
    ];

    const initialInvoices: Omit<Invoice, "id" | "createdAt">[] = [
      { invoiceNumber: "INV-2026-001", contactName: "Dr. Miles Dyson", amount: 6250, status: "Paid", dueDate: "2026-07-01", items: [
        { id: "item1", description: "Phase 1: Architecture audit", quantity: 1, rate: 6250, amount: 6250 }
      ]},
      { invoiceNumber: "INV-2026-002", contactName: "John Connor", amount: 15000, status: "Sent", dueDate: "2026-07-15", items: [
        { id: "item2", description: "Phase 1: Curriculum drafting and setup fee", quantity: 1, rate: 15000, amount: 15000 }
      ]}
    ];

    const initialSubscriptions: Omit<Subscription, "id" | "createdAt">[] = [
      { name: "Google Workspace Enterprise", cost: 120, billingCycle: "Monthly", nextRenewal: "2026-07-01", category: "Communication", status: "Active" },
      { name: "Firebase Enterprise Plan", cost: 45, billingCycle: "Monthly", nextRenewal: "2026-07-10", category: "Hosting", status: "Active" },
      { name: "Vercel Pro Teams", cost: 60, billingCycle: "Monthly", nextRenewal: "2026-07-15", category: "Hosting", status: "Active" },
      { name: "GitHub Copilot Business", cost: 38, billingCycle: "Monthly", nextRenewal: "2026-07-20", category: "AI / SaaS", status: "Active" },
      { name: "Midjourney Studio Pack", cost: 300, billingCycle: "Annual", nextRenewal: "2027-01-15", category: "Design Tools", status: "Active" }
    ];

    const initialTodoTasks: Omit<TodoTask, "id" | "createdAt">[] = [
      { title: "Review Cyberdyne proposal specs", description: "Double check numbers and deliverables with technical leads.", status: "Todo", priority: "High", dueDate: "2026-06-25" },
      { title: "Draft initial tutorial on privacy", description: "Focus on CSS styling blur components and dashboard layouts.", status: "In Progress", priority: "Medium", dueDate: "2026-06-28" },
      { title: "Schedule follow up with Sarah", description: "Brief catch-up regarding cybersecurity requirements.", status: "Done", priority: "Low", dueDate: "2026-06-20" }
    ];

    const initialGmailMessages: GmailMessage[] = [
      { id: "g1", from: "dyson@cyberdyne.io", fromName: "Dr. Miles Dyson", to: "operations@crmconsulting.com", subject: "Questions on Operations Proposal", body: "Hello CRM Team, I reviewed the Phase 2 plan and have a couple of questions about the cloud migration timeline. Can we schedule a brief Google Meet next week to discuss?", date: "2026-06-23T10:15:00Z", isRead: false, isDraft: false },
      { id: "g2", from: "operations@crmconsulting.com", fromName: "CRM Operator", to: "sarah@resistance.net", subject: "Onboarding Session Confirmed", body: "Hi Sarah, Your technical cybersecurity onboarding has been successfully logged. Your training modules will deploy soon.", date: "2026-06-22T14:30:00Z", isRead: true, isDraft: false }
    ];

    const initialMeetEvents: MeetEvent[] = [
      { id: "m1", title: "Dyson Proposal Synch", contactName: "Dr. Miles Dyson", date: "2026-06-28", time: "11:00", meetLink: "https://meet.google.com/abc-defg-hij", createdAt: "2026-06-23T12:00:00Z" }
    ];

    const initialActivityLogs: Omit<ActivityLog, "id" | "timestamp">[] = [
      { type: "lead", action: "Lead Created", description: "Lead Johnathan Miller was successfully added via Inbound Email." },
      { type: "project", action: "Project Started", description: "Operations Architecture Upgrade has entered status: In Progress." },
      { type: "invoice", action: "Invoice Paid", description: "Invoice INV-2026-001 has been marked as fully Paid ($6,250)." }
    ];

    const initialQuickNotes: Omit<QuickNote, "id" | "createdAt">[] = [
      { title: "Weekly Operations Printing Checklists", content: "• Proofread outbound invoices & saas billing cycles.\n• Cross-reference lead acquisition values.\n• Print and file physical reports under confidentiality protocols.\n• Validate backup servers are functional.", category: "General", isPinned: true },
      { title: "Dyson Project Specifications Briefing", content: "Critical requirements:\n- Upgrade security architecture to fully encrypted CJS targets.\n- Budget ceiling set to $15,000 for phase one.\n- Review milestones every Monday morning with technical leads.", category: "Project", isPinned: true },
      { title: "Sarah Connor Outreach Reminders", content: "Notes from call:\n- Inquire about cybersecurity audit timelines.\n- Key focus is local encryption standards & redaction modes.\n- Send brochure regarding full-stack capabilities.", category: "Lead", isPinned: false }
    ];

    if (forceLocal) {
      // Set to local memory and localStorage fallback
      const applyLocal = (key: string, data: any[]) => {
        const fullData = data.map(item => ({ ...item, id: generateId(), createdAt: new Date().toISOString() }));
        localStorage.setItem(key, JSON.stringify(fullData));
        return fullData;
      };
      
      setLeads(applyLocal("crm_leads", initialLeads));
      setContacts(applyLocal("crm_contacts", initialContacts));
      setProjects(applyLocal("crm_projects", initialProjects));
      setTutorials(applyLocal("crm_tutorials", initialTutorials));
      setInvoices(applyLocal("crm_invoices", initialInvoices));
      setSubscriptions(applyLocal("crm_subscriptions", initialSubscriptions));
      setTodoTasks(applyLocal("crm_todoTasks", initialTodoTasks));
      setQuickNotes(applyLocal("crm_quickNotes", initialQuickNotes));
      setGmailMessages(initialGmailMessages);
      localStorage.setItem("crm_gmailMessages", JSON.stringify(initialGmailMessages));
      setMeetEvents(initialMeetEvents);
      localStorage.setItem("crm_meetEvents", JSON.stringify(initialMeetEvents));
      
      const fullLogs = initialActivityLogs.map(log => ({ ...log, id: generateId(), timestamp: new Date().toISOString() }));
      setActivityLogs(fullLogs);
      localStorage.setItem("crm_activityLogs", JSON.stringify(fullLogs));
      
      setIsLoading(false);
      return;
    }

    // Try seeding to Firebase
    try {
      const seedCol = async (colName: string, items: any[]) => {
        const colRef = collection(db, colName);
        const snap = await getDocs(colRef);
        if (snap.empty) {
          for (const item of items) {
            await addDoc(colRef, {
              ...item,
              createdAt: new Date().toISOString()
            });
          }
        }
      };

      await seedCol("leads", initialLeads);
      await seedCol("contacts", initialContacts);
      await seedCol("projects", initialProjects);
      await seedCol("tutorials", initialTutorials);
      await seedCol("invoices", initialInvoices);
      await seedCol("subscriptions", initialSubscriptions);
      await seedCol("todoTasks", initialTodoTasks);
      await seedCol("quickNotes", initialQuickNotes);
      await seedCol("gmailMessages", initialGmailMessages);
      await seedCol("meetEvents", initialMeetEvents);
      
      // Seed logs
      const logsRef = collection(db, "activityLogs");
      const logsSnap = await getDocs(logsRef);
      if (logsSnap.empty) {
        for (const log of initialActivityLogs) {
          await addDoc(logsRef, {
            ...log,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn("Seeding database failed, using local storage instead:", e);
      seedDefaultData(true);
    }
  };

  // Real-time listener effect
  useEffect(() => {
    // Wait for the auth state to resolve, and never open Firestore listeners
    // (or attempt to seed data) for a signed-out visitor. Without this guard,
    // the read/create calls below would simply fail against the locked-down
    // firestore.rules for anyone who isn't the authenticated owner - but they'd
    // still fire, spam the console with permission-denied errors, and could
    // trip the fallback-to-localStorage path unnecessarily.
    if (authLoading) {
      return;
    }
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    if (useFirebaseFallback) {
      // Load from localStorage if Firebase is flagged to fallback
      const loadLocal = (key: string) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
      };
      setLeads(loadLocal("crm_leads"));
      setContacts(loadLocal("crm_contacts"));
      setProjects(loadLocal("crm_projects"));
      setTutorials(loadLocal("crm_tutorials"));
      setInvoices(loadLocal("crm_invoices"));
      setSubscriptions(loadLocal("crm_subscriptions"));
      setTodoTasks(loadLocal("crm_todoTasks"));
      setQuickNotes(loadLocal("crm_quickNotes"));
      setFinancialTransactions(loadLocal("crm_financialTransactions"));
      setActivityLogs(loadLocal("crm_activityLogs"));
      setGmailMessages(loadLocal("crm_gmailMessages"));
      setMeetEvents(loadLocal("crm_meetEvents"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up real-time queries for each collection
    const unsubscribes: (() => void)[] = [];

    const handleSync = (colName: string, setter: React.Dispatch<React.SetStateAction<any[]>>, localKey: string) => {
      try {
        const q = collection(db, colName);
        const unsub = onSnapshot(q, (snapshot) => {
          // Only trigger the demo-data seed the first time we ever observe this
          // collection (and only if it was empty then). Without this guard, a user
          // who deletes every record in a collection would see the fake demo
          // records silently re-created on the very next snapshot, since every
          // subsequent empty snapshot would look identical to a fresh database.
          seededCollectionsRef.current.add(colName);

          // Auto-seeding demo data is disabled for production/client use.
          // An empty collection is just an empty collection now.
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setter(data);
        }, (err) => {
          console.error(`Firebase snapshot error for ${colName}:`, err);
          // Flag fallback to localStorage
          setUseFirebaseFallback(true);
          handleFirestoreError(err, OperationType.GET, colName);
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.error(`Firebase collection connection failed for ${colName}:`, err);
        setUseFirebaseFallback(true);
        handleFirestoreError(err, OperationType.GET, colName);
      }
    };

    handleSync("leads", setLeads, "crm_leads");
    handleSync("contacts", setContacts, "crm_contacts");
    handleSync("projects", setProjects, "crm_projects");
    handleSync("tutorials", setTutorials, "crm_tutorials");
    handleSync("invoices", setInvoices, "crm_invoices");
    handleSync("subscriptions", setSubscriptions, "crm_subscriptions");
    handleSync("todoTasks", setTodoTasks, "crm_todoTasks");
    handleSync("quickNotes", setQuickNotes, "crm_quickNotes");
    handleSync("financialTransactions", setFinancialTransactions, "crm_financialTransactions");
    handleSync("activityLogs", setActivityLogs, "crm_activityLogs");
    handleSync("gmailMessages", setGmailMessages, "crm_gmailMessages");
    handleSync("meetEvents", setMeetEvents, "crm_meetEvents");

    // Timeout loading state just in case Firestore takes too long/fails silently
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      unsubscribes.forEach(unsub => unsub());
      clearTimeout(timer);
    };
  }, [useFirebaseFallback, authUser, authLoading]);

  // Firestore & local CRUD helpers
  const saveLocalAndState = (key: string, list: any[], setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    localStorage.setItem(key, JSON.stringify(list));
    setter(list);
  };

  // 1. Leads CRUD
  const addLead = async (leadData: Omit<Lead, "id" | "createdAt">) => {
    const actionDesc = `Added lead: ${leadData.name} (${leadData.company})`;
    await addActivityLog("lead", "Lead Created", actionDesc);

    if (useFirebaseFallback) {
      const newLead: Lead = {
        ...leadData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_leads", [...leads, newLead], setLeads);
    } else {
      await addDoc(collection(db, "leads"), {
        ...leadData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Lead "${leadData.name}" successfully saved and synced to Cloud Firestore`, "success");
  };

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    const current = leads.find(l => l.id === id);
    const actionDesc = `Updated lead details for ${current?.name || "Unknown"}`;
    await addActivityLog("lead", "Lead Updated", actionDesc);

    if (useFirebaseFallback) {
      const updated = leads.map(l => l.id === id ? { ...l, ...leadData } : l);
      saveLocalAndState("crm_leads", updated, setLeads);
    } else {
      await updateDoc(doc(db, "leads", id), leadData);
    }
    showToast(`Changes to lead "${current?.name || "Lead"}" successfully synchronized`, "success");
  };

  const deleteLead = async (id: string) => {
    const current = leads.find(l => l.id === id);
    const actionDesc = `Deleted lead: ${current?.name || "Unknown"}`;
    await addActivityLog("lead", "Lead Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = leads.filter(l => l.id !== id);
      saveLocalAndState("crm_leads", remaining, setLeads);
    } else {
      await deleteDoc(doc(db, "leads", id));
    }
    showToast(`Lead "${current?.name || "Lead"}" removed and updated in the cloud`, "info");
  };

  // 2. Contacts CRUD
  const addContact = async (contactData: Omit<Contact, "id" | "createdAt">) => {
    const actionDesc = `Added contact: ${contactData.name} at ${contactData.company}`;
    await addActivityLog("contact", "Contact Created", actionDesc);

    if (useFirebaseFallback) {
      const newContact: Contact = {
        ...contactData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_contacts", [...contacts, newContact], setContacts);
    } else {
      await addDoc(collection(db, "contacts"), {
        ...contactData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Contact "${contactData.name}" successfully created and synced to cloud`, "success");
  };

  const updateContact = async (id: string, contactData: Partial<Contact>) => {
    const current = contacts.find(c => c.id === id);
    const actionDesc = `Updated contact details for ${current?.name || "Unknown"}`;
    await addActivityLog("contact", "Contact Updated", actionDesc);

    if (useFirebaseFallback) {
      const updated = contacts.map(c => c.id === id ? { ...c, ...contactData } : c);
      saveLocalAndState("crm_contacts", updated, setContacts);
    } else {
      await updateDoc(doc(db, "contacts", id), contactData);
    }
    showToast(`Contact "${current?.name || "Contact"}" details updated and synchronized`, "success");
  };

  const deleteContact = async (id: string) => {
    const current = contacts.find(c => c.id === id);
    const actionDesc = `Deleted contact: ${current?.name || "Unknown"}`;
    await addActivityLog("contact", "Contact Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = contacts.filter(c => c.id !== id);
      saveLocalAndState("crm_contacts", remaining, setContacts);
    } else {
      await deleteDoc(doc(db, "contacts", id));
    }
    showToast(`Contact "${current?.name || "Contact"}" removed from cloud database`, "info");
  };

  const bulkAddContacts = async (contactsList: Omit<Contact, "id" | "createdAt">[]) => {
    if (contactsList.length === 0) return;

    const actionDesc = `Bulk imported ${contactsList.length} contacts via CSV`;
    await addActivityLog("contact", "Contacts Imported", actionDesc);

    if (useFirebaseFallback) {
      const newContacts: Contact[] = contactsList.map(contactData => ({
        ...contactData,
        id: generateId(),
        createdAt: new Date().toISOString()
      }));
      saveLocalAndState("crm_contacts", [...contacts, ...newContacts], setContacts);
    } else {
      try {
        const batch = writeBatch(db);
        contactsList.forEach(contactData => {
          const docRef = doc(collection(db, "contacts"));
          batch.set(docRef, {
            ...contactData,
            createdAt: new Date().toISOString()
          });
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "contacts");
      }
    }
    showToast(`Successfully imported ${contactsList.length} client records`, "success");
  };

  // 3. Projects CRUD
  const addProject = async (projectData: Omit<Project, "id" | "createdAt">) => {
    const actionDesc = `Created project: ${projectData.name} for ${projectData.contactName}`;
    await addActivityLog("project", "Project Created", actionDesc);

    if (useFirebaseFallback) {
      const newProject: Project = {
        ...projectData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_projects", [...projects, newProject], setProjects);
    } else {
      await addDoc(collection(db, "projects"), {
        ...projectData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Project "${projectData.name}" successfully created and synced to cloud`, "success");
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    const current = projects.find(p => p.id === id);
    const actionDesc = `Updated project details for ${current?.name || "Unknown"}`;
    await addActivityLog("project", "Project Updated", actionDesc);

    if (useFirebaseFallback) {
      const updated = projects.map(p => p.id === id ? { ...p, ...projectData } : p);
      saveLocalAndState("crm_projects", updated, setProjects);
    } else {
      await updateDoc(doc(db, "projects", id), projectData);
    }
    showToast(`Project "${current?.name || "Project"}" details updated and synchronized`, "success");
  };

  const deleteProject = async (id: string) => {
    const current = projects.find(p => p.id === id);
    const actionDesc = `Deleted project: ${current?.name || "Unknown"}`;
    await addActivityLog("project", "Project Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = projects.filter(p => p.id !== id);
      saveLocalAndState("crm_projects", remaining, setProjects);
    } else {
      await deleteDoc(doc(db, "projects", id));
    }
    showToast(`Project "${current?.name || "Project"}" removed from database`, "info");
  };

  // 4. Tutorials CRUD
  const addTutorial = async (tutorialData: Omit<TutorialPost, "id" | "createdAt">) => {
    const actionDesc = `Logged tutorial post: ${tutorialData.title}`;
    await addActivityLog("tutorial", "Tutorial Created", actionDesc);

    if (useFirebaseFallback) {
      const newTutorial: TutorialPost = {
        ...tutorialData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_tutorials", [...tutorials, newTutorial], setTutorials);
    } else {
      await addDoc(collection(db, "tutorials"), {
        ...tutorialData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Tutorial "${tutorialData.title}" successfully created and synced to cloud`, "success");
  };

  const updateTutorial = async (id: string, tutorialData: Partial<TutorialPost>) => {
    const current = tutorials.find(t => t.id === id);
    const actionDesc = `Updated tutorial: ${current?.title || "Unknown"}`;
    await addActivityLog("tutorial", "Tutorial Updated", actionDesc);

    if (useFirebaseFallback) {
      const updated = tutorials.map(t => t.id === id ? { ...t, ...tutorialData } : t);
      saveLocalAndState("crm_tutorials", updated, setTutorials);
    } else {
      await updateDoc(doc(db, "tutorials", id), tutorialData);
    }
    showToast(`Tutorial "${current?.title || "Tutorial"}" updated and synchronized`, "success");
  };

  const deleteTutorial = async (id: string) => {
    const current = tutorials.find(t => t.id === id);
    const actionDesc = `Deleted tutorial: ${current?.title || "Unknown"}`;
    await addActivityLog("tutorial", "Tutorial Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = tutorials.filter(t => t.id !== id);
      saveLocalAndState("crm_tutorials", remaining, setTutorials);
    } else {
      await deleteDoc(doc(db, "tutorials", id));
    }
    showToast(`Tutorial "${current?.title || "Tutorial"}" deleted from database`, "info");
  };

  // 5. Invoices CRUD
  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt">) => {
    const actionDesc = `Issued invoice ${invoiceData.invoiceNumber} to ${invoiceData.contactName} ($${invoiceData.amount})`;
    await addActivityLog("invoice", "Invoice Created", actionDesc);

    if (useFirebaseFallback) {
      const newInvoice: Invoice = {
        ...invoiceData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_invoices", [...invoices, newInvoice], setInvoices);
    } else {
      await addDoc(collection(db, "invoices"), {
        ...invoiceData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Invoice "${invoiceData.invoiceNumber}" successfully created and synchronized`, "success");
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    const current = invoices.find(inv => inv.id === id);
    const actionDesc = `Updated invoice details for ${current?.invoiceNumber || "Unknown"}`;
    await addActivityLog("invoice", "Invoice Updated", actionDesc);

    if (useFirebaseFallback) {
      const updated = invoices.map(inv => inv.id === id ? { ...inv, ...invoiceData } : inv);
      saveLocalAndState("crm_invoices", updated, setInvoices);
    } else {
      await updateDoc(doc(db, "invoices", id), invoiceData);
    }
    showToast(`Invoice "${current?.invoiceNumber || "Invoice"}" details updated and synchronized`, "success");
  };

  const deleteInvoice = async (id: string) => {
    const current = invoices.find(inv => inv.id === id);
    const actionDesc = `Deleted invoice: ${current?.invoiceNumber || "Unknown"}`;
    await addActivityLog("invoice", "Invoice Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = invoices.filter(inv => inv.id !== id);
      saveLocalAndState("crm_invoices", remaining, setInvoices);
    } else {
      await deleteDoc(doc(db, "invoices", id));
    }
    showToast(`Invoice "${current?.invoiceNumber || "Invoice"}" removed from database`, "info");
  };

  // 6. Subscriptions CRUD
  const addSubscription = async (subData: Omit<Subscription, "id" | "createdAt">) => {
    const actionDesc = `Logged subscription expense: ${subData.name} ($${subData.cost}/${subData.billingCycle})`;
    await addActivityLog("subscription", "Subscription Added", actionDesc);

    if (useFirebaseFallback) {
      const newSub: Subscription = {
        ...subData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_subscriptions", [...subscriptions, newSub], setSubscriptions);
    } else {
      await addDoc(collection(db, "subscriptions"), {
        ...subData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Subscription "${subData.name}" successfully created and synchronized`, "success");
  };

  const updateSubscription = async (id: string, subData: Partial<Subscription>) => {
    const current = subscriptions.find(s => s.id === id);
    const actionDesc = `Updated subscription: ${current?.name || "Unknown"}`;
    await addActivityLog("subscription", "Subscription Updated", actionDesc);

    if (useFirebaseFallback) {
      const updated = subscriptions.map(s => s.id === id ? { ...s, ...subData } : s);
      saveLocalAndState("crm_subscriptions", updated, setSubscriptions);
    } else {
      await updateDoc(doc(db, "subscriptions", id), subData);
    }
    showToast(`Subscription "${current?.name || "Subscription"}" updated and synchronized`, "success");
  };

  const deleteSubscription = async (id: string) => {
    const current = subscriptions.find(s => s.id === id);
    const actionDesc = `Removed subscription expense: ${current?.name || "Unknown"}`;
    await addActivityLog("subscription", "Subscription Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = subscriptions.filter(s => s.id !== id);
      saveLocalAndState("crm_subscriptions", remaining, setSubscriptions);
    } else {
      await deleteDoc(doc(db, "subscriptions", id));
    }
    showToast(`Subscription "${current?.name || "Subscription"}" removed from database`, "info");
  };

  // 7. TodoTasks CRUD
  const addTodoTask = async (taskData: Omit<TodoTask, "id" | "createdAt">) => {
    const actionDesc = `Created task: "${taskData.title}"`;
    await addActivityLog("todo", "Task Created", actionDesc);

    if (useFirebaseFallback) {
      const newTask: TodoTask = {
        ...taskData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_todoTasks", [...todoTasks, newTask], setTodoTasks);
    } else {
      await addDoc(collection(db, "todoTasks"), {
        ...taskData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Task "${taskData.title}" created and synchronized`, "success");
  };

  const updateTodoTask = async (id: string, taskData: Partial<TodoTask>) => {
    const current = todoTasks.find(t => t.id === id);
    if (useFirebaseFallback) {
      const updated = todoTasks.map(t => t.id === id ? { ...t, ...taskData } : t);
      saveLocalAndState("crm_todoTasks", updated, setTodoTasks);
    } else {
      await updateDoc(doc(db, "todoTasks", id), taskData);
    }
    showToast(`Task "${taskData.title || current?.title || "Task"}" updated and synchronized`, "success");
  };

  const deleteTodoTask = async (id: string) => {
    const current = todoTasks.find(t => t.id === id);
    const actionDesc = `Deleted task: "${current?.title || "Unknown"}"`;
    await addActivityLog("todo", "Task Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = todoTasks.filter(t => t.id !== id);
      saveLocalAndState("crm_todoTasks", remaining, setTodoTasks);
    } else {
      await deleteDoc(doc(db, "todoTasks", id));
    }
    showToast(`Task "${current?.title || "Task"}" removed from board`, "info");
  };

  // 8. Activity Logs Action
  const addActivityLog = async (type: ActivityLog["type"], action: string, description: string) => {
    const newLog = {
      type,
      action,
      description,
      timestamp: new Date().toISOString()
    };

    if (useFirebaseFallback) {
      const fullLog: ActivityLog = {
        ...newLog,
        id: generateId()
      };
      saveLocalAndState("crm_activityLogs", [fullLog, ...activityLogs].slice(0, 50), setActivityLogs);
    } else {
      try {
        await addDoc(collection(db, "activityLogs"), newLog);
      } catch (e) {
        console.error("Failed to add activity log in Firestore:", e);
      }
    }
  };

  const clearActivityLogs = async () => {
    if (useFirebaseFallback) {
      saveLocalAndState("crm_activityLogs", [], setActivityLogs);
    } else {
      try {
        const snap = await getDocs(collection(db, "activityLogs"));
        for (const sdoc of snap.docs) {
          await deleteDoc(doc(db, "activityLogs", sdoc.id));
        }
      } catch (e) {
        console.error("Failed to clear logs:", e);
      }
    }
  };

  // 9. Gmail Simulation Integration
  const sendGmailMessage = async (msgData: Omit<GmailMessage, "id" | "date" | "isRead">) => {
    const actionDesc = `Sent Gmail to ${msgData.to}: "${msgData.subject}"`;
    await addActivityLog("gmail", "Gmail Outbound", actionDesc);

    const newMsg = {
      ...msgData,
      date: new Date().toISOString(),
      isRead: true
    };

    if (useFirebaseFallback) {
      const fullMsg: GmailMessage = {
        ...newMsg,
        id: generateId()
      };
      saveLocalAndState("crm_gmailMessages", [...gmailMessages, fullMsg], setGmailMessages);
    } else {
      await addDoc(collection(db, "gmailMessages"), newMsg);
    }
    showToast(`Email sent to "${msgData.to}" and logged successfully`, "success");
  };

  const markEmailAsRead = async (id: string) => {
    if (useFirebaseFallback) {
      const updated = gmailMessages.map(g => g.id === id ? { ...g, isRead: true } : g);
      saveLocalAndState("crm_gmailMessages", updated, setGmailMessages);
    } else {
      await updateDoc(doc(db, "gmailMessages", id), { isRead: true });
    }
    showToast(`Email marked as read`, "success");
  };

  // 10. Google Meet Integration
  const scheduleMeet = async (meetData: Omit<MeetEvent, "id" | "createdAt" | "meetLink">) => {
    const mId = generateId();
    const meetLink = `https://meet.google.com/${mId.slice(0,3)}-${mId.slice(3,7)}-${mId.slice(7,10)}`;
    const actionDesc = `Scheduled Google Meet with ${meetData.contactName} ("${meetData.title}") on ${meetData.date}`;
    await addActivityLog("meet", "Meeting Scheduled", actionDesc);

    const newMeet = {
      ...meetData,
      meetLink,
      createdAt: new Date().toISOString()
    };

    if (useFirebaseFallback) {
      const fullMeet: MeetEvent = {
        ...newMeet,
        id: mId
      };
      saveLocalAndState("crm_meetEvents", [...meetEvents, fullMeet], setMeetEvents);
    } else {
      await addDoc(collection(db, "meetEvents"), newMeet);
    }
    showToast(`Google Meet scheduled with ${meetData.contactName}`, "success");
  };

  const deleteMeetEvent = async (id: string) => {
    const current = meetEvents.find(m => m.id === id);
    const actionDesc = `Cancelled Google Meet with ${current?.contactName || "Unknown"}`;
    await addActivityLog("meet", "Meeting Cancelled", actionDesc);

    if (useFirebaseFallback) {
      const remaining = meetEvents.filter(m => m.id !== id);
      saveLocalAndState("crm_meetEvents", remaining, setMeetEvents);
    } else {
      await deleteDoc(doc(db, "meetEvents", id));
    }
    showToast(`Google Meet with ${current?.contactName || "Contact"} has been cancelled`, "info");
  };

  // 11. Quick Notes CRUD
  const addQuickNote = async (noteData: Omit<QuickNote, "id" | "createdAt">) => {
    const actionDesc = `Created note: "${noteData.title}"`;
    await addActivityLog("todo", "Note Created", actionDesc);

    if (useFirebaseFallback) {
      const newNote: QuickNote = {
        ...noteData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_quickNotes", [...quickNotes, newNote], setQuickNotes);
    } else {
      await addDoc(collection(db, "quickNotes"), {
        ...noteData,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Quick note "${noteData.title}" saved and synced to cloud`, "success");
  };

  const updateQuickNote = async (id: string, noteData: Partial<QuickNote>) => {
    const current = quickNotes.find(n => n.id === id);
    if (useFirebaseFallback) {
      const updated = quickNotes.map(n => n.id === id ? { ...n, ...noteData } : n);
      saveLocalAndState("crm_quickNotes", updated, setQuickNotes);
    } else {
      await updateDoc(doc(db, "quickNotes", id), noteData);
    }
    showToast(`Quick note "${noteData.title || current?.title || "Note"}" updated and synchronized`, "success");
  };

  const deleteQuickNote = async (id: string) => {
    const current = quickNotes.find(n => n.id === id);
    const actionDesc = `Deleted note: "${current?.title || "Unknown"}"`;
    await addActivityLog("todo", "Note Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = quickNotes.filter(n => n.id !== id);
      saveLocalAndState("crm_quickNotes", remaining, setQuickNotes);
    } else {
      await deleteDoc(doc(db, "quickNotes", id));
    }
    showToast(`Quick note "${current?.title || "Note"}" deleted from cloud`, "info");
  };

  // 12. Financial Transactions (Manual P&L Adjustments)
  const addFinancialTransaction = async (txData: Omit<FinancialTransaction, "id" | "createdAt">) => {
    const actionDesc = `Added financial transaction: ${txData.type} - ${txData.category} ($${txData.amount})`;
    await addActivityLog("todo", "Transaction Created", actionDesc);

    if (useFirebaseFallback) {
      const newTx: FinancialTransaction = {
        ...txData,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      saveLocalAndState("crm_financialTransactions", [...financialTransactions, newTx], setFinancialTransactions);
    } else {
      try {
        await addDoc(collection(db, "financialTransactions"), {
          ...txData,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "financialTransactions");
      }
    }
    showToast(`Financial transaction "${txData.category}" saved successfully`, "success");
  };

  const deleteFinancialTransaction = async (id: string) => {
    const current = financialTransactions.find(t => t.id === id);
    const actionDesc = `Deleted financial transaction: ${current?.category || "Unknown"}`;
    await addActivityLog("todo", "Transaction Deleted", actionDesc);

    if (useFirebaseFallback) {
      const remaining = financialTransactions.filter(t => t.id !== id);
      saveLocalAndState("crm_financialTransactions", remaining, setFinancialTransactions);
    } else {
      try {
        await deleteDoc(doc(db, "financialTransactions", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `financialTransactions/${id}`);
      }
    }
    showToast(`Financial transaction deleted`, "info");
  };

  return (
    <CRMContext.Provider value={{
      leads,
      contacts,
      projects,
      tutorials,
      invoices,
      subscriptions,
      todoTasks,
      activityLogs: [...activityLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      gmailMessages: [...gmailMessages].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      meetEvents: [...meetEvents].sort((a,b) => new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime()),
      isPrivacyMode,
      togglePrivacyMode,
      isLoading,
      addLead,
      updateLead,
      deleteLead,
      addContact,
      bulkAddContacts,
      updateContact,
      deleteContact,
      addProject,
      updateProject,
      deleteProject,
      addTutorial,
      updateTutorial,
      deleteTutorial,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      addTodoTask,
      updateTodoTask,
      deleteTodoTask,
      addActivityLog,
      clearActivityLogs,
      sendGmailMessage,
      markEmailAsRead,
      scheduleMeet,
      deleteMeetEvent,
      quickNotes: [...quickNotes].sort((a,b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
      addQuickNote,
      updateQuickNote,
      deleteQuickNote,
      financialTransactions: [...financialTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      addFinancialTransaction,
      deleteFinancialTransaction,
      toasts,
      showToast,
      removeToast,
      authUser,
      authLoading,
      loginWithGoogle,
      logout
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
};
