export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
  source: string;
  notes: string;
  createdAt: string;
  expectedCloseMonth?: "Current" | "Next";
}

export interface FamilyLink {
  name: string;
  relationship: "Spouse" | "Child" | "Parent" | "Other";
  age: number;
  social: string;
}

export interface EnrolledProduct {
  productId: string;
  name: string;
  enrollmentDate: string;
  contractValue: number;
  status: "Enrolled" | "Active" | "Completed" | "Cancelled";
  billingCycle: "One-Time" | "Monthly" | "Quarterly" | "Annual";
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  notes: string;
  createdAt: string;
  status?: "Active" | "Inactive" | "Lead" | "Partner" | "VIP";
  leadSource?: "Referral" | "Website" | "Cold Outreach" | "Event" | "LinkedIn" | "Other";
  recentInteraction?: "Today" | "This Week" | "This Month" | "Over 30 Days" | "None";
  
  // Extended Personal Profile & Contract Tracking Fields
  dob?: string;
  ssn?: string;
  address?: string;
  employer?: string;
  monthlyIncome?: number;
  referralName?: string;
  referralDate?: string;
  familyLinks?: FamilyLink[];
  enrolledProducts?: EnrolledProduct[];
}

export interface ProjectSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Project {
  id: string;
  name: string;
  contactName: string;
  status: "Planning" | "In Progress" | "In Review" | "Completed" | "On Hold";
  value: number;
  deadline: string;
  description: string;
  subtasks: ProjectSubtask[];
  createdAt: string;
}

export interface TutorialPost {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  category: "Design" | "Development" | "Marketing" | "Sales" | "Operations";
  status: "Draft" | "Published";
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contactName: string;
  amount: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  dueDate: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: "Monthly" | "Annual";
  nextRenewal: string;
  category: "Hosting" | "AI / SaaS" | "Marketing" | "Design Tools" | "Communication" | "Other";
  status: "Active" | "Paused" | "Cancelled";
  createdAt: string;
}

export interface TodoTask {
  id: string;
  title: string;
  description: string;
  status: "Todo" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  projectId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: "lead" | "contact" | "project" | "tutorial" | "invoice" | "subscription" | "todo" | "gmail" | "meet";
  action: string;
  description: string;
  timestamp: string;
}

export interface GmailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isDraft: boolean;
}

export interface MeetEvent {
  id: string;
  title: string;
  contactName: string;
  date: string;
  time: string;
  meetLink: string;
  createdAt: string;
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  category: "General" | "Lead" | "Project" | "Meeting" | "Invoice" | "Todo";
  isPinned: boolean;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
}
