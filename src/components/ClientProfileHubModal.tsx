import React, { useState, useEffect } from "react";
import { Contact, FamilyLink, EnrolledProduct, Invoice } from "../types";
import { useCRM } from "../context/CRMContext";
import { 
  X, 
  User, 
  Users, 
  CreditCard, 
  FileText, 
  Printer, 
  Clipboard, 
  ArrowLeft, 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Award,
  Sparkles,
  AlertCircle,
  UserCheck,
  Check
} from "lucide-react";

interface ClientProfileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
}

const PRODUCT_CATALOG = [
  "Credit Report Audit & Analysis",
  "Credit Inquiry Dispute Removal",
  "Late Payment Deletion Campaign",
  "Collections & Charge-offs Dispute",
  "Bankruptcies Public Record Challenge",
  "Tax Liens & Judgments Audit",
  "Foreclosure Disputing Service",
  "Repossessions Dispute Campaign",
  "Student Loan Consolidation Consultation",
  "Identity Theft Credit Restoration",
  "Personal Credit Monitoring Setup",
  "FICO Score Optimizer Campaign",
  "Business Credit Builder (Tier 1 Setup)",
  "Business Credit Builder (Tier 2 Vendor Lines)",
  "Business Credit Builder (Tier 3 Fleet Cards)",
  "Dun & Bradstreet Registration & Rating",
  "ChexSystems Record Clearance",
  "Hard Inquiry Sweep (Express disputing)",
  "Debt Settlement Negotiation Program",
  "Goodwill Letter Discretionary Request",
  "Credit Card Utilization Restructure",
  "Secured Credit Card Placement Guide",
  "Rapid Rescore Expedited Campaign",
  "Identity Theft Affidavit Filing",
  "Medical Debt Dispute & HIPAA Audit",
  "Child Support Dispute Review",
  "Public Record Deletion Campaign",
  "Foreclosure Assistance",
  "Divorce Consulting & Asset Protection",
  "College Consulting & Funding Planning",
  "Merchant Services & POS Placement",
  "Payroll Services & HR Setup",
  "Property & Casualty (P&C) Insurance Products",
  "Real Estate Agent Placement / Consultation",
  "Credit Score Building - Starter Package",
  "Credit Score Building - Advanced Suite",
  "Premium Legal Debt Validation Check",
  "Fair Credit Reporting Act (FCRA) Audit",
  "Fair Debt Collection Practices Act (FDCPA) Review",
  "Tradeline Consultation & Authorized User Setup"
];

interface LetterTemplate {
  id: string;
  name: string;
  category: "Onboarding" | "Invoicing" | "Affiliate" | "Newsletter" | "Marketing" | "Follow-up";
  subject: string;
  body: string;
}

const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "welcome_onboarding",
    name: "1. Welcome & Credit Onboarding Letter",
    category: "Onboarding",
    subject: "Welcome to Fresh Start Credit Services - Onboarding Initiated",
    body: `Dear [Name],

Welcome to Fresh Start Credit Services! We are thrilled to partner with you to rebuild your credit profile and help you achieve your financial goals.

Today, [Date], we have initiated a full comprehensive audit of your credit files across Equifax, Experian, and TransUnion. 

Your Onboarding Details:
- SSN on File: [SSN]
- DOB: [DOB]
- Address: [Address]

Next Steps:
1. We will challenge inaccurate public records, late payments, and old inquiries.
2. Ensure you keep your credit card balances under 10% of their limits.
3. Access your private credit monitoring portal weekly to track your FICO score escalation.

Let's work together to restore your financial freedom and give you the Fresh Start you deserve!

Sincerely,
Fresh Start Credit Team
operations@crmconsulting.com
www.freshstartcredit-services.com`
  },
  {
    id: "invoice_detail",
    name: "2. Client Product Invoice Document",
    category: "Invoicing",
    subject: "Service Invoice and Contract Billing Schedule",
    body: `FRESH START CREDIT SERVICES & OPERATIONS CONSULTING
Date: [Date]
Invoice Recipient: [Name]
SSN (Tax ID): [SSN]
Address: [Address]

BILLING DETAILS & ENROLLED CONTRACTS:
[Products]

Total Contract Value: $[ContractValue]
Payment Status: OUTSTANDING

Please note that payment is due as per your signed consulting agreement. For immediate assistance, merchant portal access, or custom payment plan setups, reach out directly.

Thank you for choosing Fresh Start Credit Services!
Operations Desk`
  },
  {
    id: "paid_in_full",
    name: "3. Account Paid In Full Letter & Invoice",
    category: "Invoicing",
    subject: "CONGRATULATIONS! Account Fully Paid In Full",
    body: `Dear [Name],

CONGRATULATIONS! This letter serves as formal confirmation that your account has been PAID IN FULL.

All contractual payments for your credit restoration program and consulting services have been successfully received and processed.

Summary of Account Resolution:
- Client Name: [Name]
- SSN on File: [SSN]
- Total Resolving Amount: $[ContractValue]
- Resolution Date: [Date]

With your invoices fully cleared, your credit file disputes continue on active cycles, and your FICO score remains on a positive projection. No further balances are outstanding under this contract.

We appreciate your commitment and trust in our consultancy. Please let us know if you would like to explore our business growth and auxiliary merchant/payroll services.

Sincerely,
Billing & Operations Desk
Fresh Start Credit Services
operations@crmconsulting.com`
  },
  {
    id: "referral_income",
    name: "4. Referrals Income Potential Letter (Every 90 Days)",
    category: "Affiliate",
    subject: "Earn $150+ Per Referral - Fresh Start Affiliate Program",
    body: `Dear [Name],

Did you know you can earn auxiliary income just by sharing your credit success with others? 

At Fresh Start Credit Services, we run a Client Referral Affiliate Program. For every family member, colleague, or friend you refer to us who signs up for an active credit rebuild contract, we will pay you $150 cash affiliate reward!

Income Potential Analysis:
- Refer 1 client per month: $150 / month ($1,800 / year)
- Refer 3 clients per month: $450 / month ($5,400 / year)
- Refer 5 clients per month: $750 / month ($9,000 / year)

Referrals make a massive difference in helping people secure clean slates for home mortgages, vehicle approvals, and lower interest rates. Simply have your referrals mention your name, "[Name]", upon signing up, and we will dispatch your reward instantly.

Thank you for being an valued ambassador for financial restoration!

Sincerely,
Affiliate Rewards Desk
www.freshstartcredit-services.com`
  },
  {
    id: "cross_merchant",
    name: "5. Cross Marketing: Merchant Services & POS Bundle",
    category: "Marketing",
    subject: "Save 40% on Card Processing Fees + Free POS Terminal",
    body: `Dear [Name],

As an active client building your credit score, we wanted to cross-promote our high-value corporate solution. 

Are you running a small business, online shop, or consultancy? Our high-performance MERCHANT SERVICES package can slash your credit card processing transaction fees by up to 40% compared to Stripe or PayPal!

Merchant Services Advantages:
- Next-Day Funding into your business checking accounts.
- Zero-cost terminal placement or easy e-commerce checkout API.
- Rebuilds corporate merchant rating profile.

Let us run a free, non-obligatory analysis of your current processing statements. Reply to this email or contact us at operations@crmconsulting.com to claim your free smart terminal!

Sincerely,
Merchant Services Operations
All In 1 Events & Operations Consultancy`
  },
  {
    id: "cross_payroll",
    name: "6. Cross Marketing: Payroll & HR Services Suite",
    category: "Marketing",
    subject: "Streamline Your Business with Corporate Payroll Services",
    body: `Dear [Name],

Running a business means balancing dozens of operational challenges. Let us take the pain out of managing your team!

Our premium PAYROLL SERVICES package provides:
- Fully automated direct deposit & paycheck generation.
- Full tax filings (W-2, 1099, federal/state withholdings).
- Custom HR onboarding modules for employees and contractors.

By bundling your operational services with our team, you can save valuable time every month while ensuring 100% IRS compliance.

Let's schedule a 10-minute demo to optimize your business backend.

Best regards,
Business Operations Desk
operations@crmconsulting.com`
  },
  {
    id: "cross_realestate",
    name: "7. Cross Marketing: Real Estate Agent & Mortgage Placement",
    category: "Marketing",
    subject: "Rebuilt Credit? Secure Your Dream Home & Funding Today",
    body: `Dear [Name],

Now that your credit score is rebuilt and late payments are removed, it's time to capitalize on your hard work! The ultimate payoff of a high credit score is securing property with rock-bottom interest rates.

Our certified REAL ESTATE AGENT & MORTGAGE PLACEMENT program connects you with:
- Top-rated regional realtors who understand credit-driven buyers.
- Direct funding lenders specializing in FHA, VA, and conventional financing.
- Down-payment assistance programs that save you thousands up-front.

Whether you're looking for your first home or a commercial business location, we have the network to make it happen smoothly.

Contact our mortgage coordination desk today to run your preliminary approval!

Sincerely,
Mortgage Coordination Team
www.freshstartcredit-services.com`
  },
  {
    id: "followup_late_payments",
    name: "8. Follow-up: Late Payments Deletion Campaign",
    category: "Follow-up",
    subject: "Remove damaging late payments from your credit report",
    body: `Dear [Name],

A single 30-day late payment can drag down your credit score by up to 100 points and linger for seven long years.

Fortunately, you have rights under the Fair Credit Reporting Act. Our targeted Late Payment Deletion Campaign specializes in auditing late payment records and negotiating complete deletions:
- Goodwill removals for historical clients.
- Challenge incorrect dates and payment structures.
- Eradicate legacy credit card and mortgage late marks.

We have drafted custom dispute campaigns tailored for you. Let's launch this cycle immediately to give your score a rapid boost!

Best regards,
Lead Disputes Desk`
  },
  {
    id: "followup_foreclosure",
    name: "9. Follow-up: Foreclosure & Repossession Sweep",
    category: "Follow-up",
    subject: "Urgent: Auditing past Foreclosures and Repossessions",
    body: `Dear [Name],

Past foreclosures and vehicle repossessions are among the most toxic negative items on a credit report, blocking you from securing real estate or vehicle approvals.

Our Foreclosure Assistance and Repossession Dispute Sweep uses technical validation procedures to audit lenders:
- Check if the repossessed asset sale complies with state laws.
- Audit the foreclosure record dates and balancing worksheets.
- Force complete deletion if validation criteria are not met.

Let us audit your Experian, TransUnion, and Equifax logs to uncover these validation errors. Reply to this letter to begin your asset dispute campaign!

Sincerely,
Asset Restoration Desk
Fresh Start Credit Services`
  },
  {
    id: "followup_college",
    name: "10. Follow-up: College Funding & Tuition Optimization",
    category: "Follow-up",
    subject: "Halve your family's college tuition and secure funding",
    body: `Dear [Name],

College tuitions are at an all-time high, but you shouldn't have to mortgage your retirement to educate your children.

Our COLLEGE CONSULTING and financial planning suite specializes in:
- FAFSA positioning to maximize free grants.
- Restructuring parent assets to qualify for financial aids.
- Accessing little-known private institutional scholarships.

Let us help your children get accepted into their top-choice universities while keeping your family out of toxic student loan debt.

Contact us to schedule a comprehensive college consult!

Warm regards,
College Consulting Advisors`
  },
  {
    id: "newsletter_q1",
    name: "11. Quarterly Newsletter - Fresh Start Digest",
    category: "Newsletter",
    subject: "Quarterly Financial Digest - Credit, Security, and Wealth Builders",
    body: `FRESH START FINANCIAL DIGEST - QUARTERLY NEWSLETTER
Published by Fresh Start Credit Services

Inside this Quarter's Issue:
1. Credit Freeze Secrets: How to freeze your files in under 5 minutes to prevent identity fraud.
2. The 10% Utilization Rule: Why keeping credit card balances under 10% is the single fastest way to rocket your score past 750.
3. Merchant Alert: Beware of hidden card reader fees during operational transitions.
4. Client Showcase: How one client used our Real Estate Placement program to purchase a duplex with 3.5% down!

Have questions or need a personalized review? Contact our consultants anytime!

To your financial success,
All In 1 Events & Operations Consultancy`
  },
  {
    id: "marketing_divorce",
    name: "12. Cross Marketing: Divorce Financial Protection",
    category: "Newsletter",
    subject: "Insulate Your Credit Score & Assets During Divorce",
    body: `Dear [Name],

Divorcing is emotional, but protecting your credit score must remain rational. 

Joint credit cards, auto loans, and mortgages can severely damage your FICO score if a former spouse misses a payment. Our DIVORCE CONSULTING suite is designed to shield you:
- Partitioning of joint debt liabilities.
- Disentangling co-signed financial accounts.
- Asset valuation, protection audits, and rebuilding personal credit lines.

Insulate your credit and protect your financial independence. Reach out in strict confidence.

With respect,
Divorce Asset Advisory Desk
Fresh Start Credit Services`
  }
];

export const ClientProfileHubModal: React.FC<ClientProfileHubModalProps> = ({ isOpen, onClose, contact }) => {
  const { invoices, updateContact, addInvoice, addFinancialTransaction, showToast } = useCRM();
  const [activeTab, setActiveTab] = useState<"profile" | "family" | "products" | "letters" | "billing">("profile");

  // Show/Hide SSN toggle
  const [showSsn, setShowSsn] = useState(false);

  // Profile Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone || "");
  const [company, setCompany] = useState(contact.company || "");
  const [role, setRole] = useState(contact.role || "");
  const [dob, setDob] = useState(contact.dob || "");
  const [ssn, setSsn] = useState(contact.ssn || "");
  const [address, setAddress] = useState(contact.address || "");
  const [employer, setEmployer] = useState(contact.employer || "");
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">(contact.monthlyIncome || "");
  const [referralName, setReferralName] = useState(contact.referralName || "");
  const [referralDate, setReferralDate] = useState(contact.referralDate || "");

  // Family links form
  const [famName, setFamName] = useState("");
  const [famRel, setFamRel] = useState<FamilyLink["relationship"]>("Child");
  const [famAge, setFamAge] = useState<number | "">("");
  const [famSocial, setFamSocial] = useState("");

  // Product enrollment form
  const [selectedProduct, setSelectedProduct] = useState("");
  const [contractValue, setContractValue] = useState<number | "">("");
  const [billingCycle, setBillingCycle] = useState<EnrolledProduct["billingCycle"]>("Monthly");
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrolledProduct["status"]>("Enrolled");
  const [enrollmentDate, setEnrollmentDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Letters states
  const [selectedLetterId, setSelectedLetterId] = useState("welcome_onboarding");
  const [customLetterBody, setCustomLetterBody] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Invoices list for this contact
  const clientInvoices = invoices.filter(inv => inv.contactName.toLowerCase() === contact.name.toLowerCase());

  // Reload contact data when contact changes
  useEffect(() => {
    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone || "");
    setCompany(contact.company || "");
    setRole(contact.role || "");
    setDob(contact.dob || "");
    setSsn(contact.ssn || "");
    setAddress(contact.address || "");
    setEmployer(contact.employer || "");
    setMonthlyIncome(contact.monthlyIncome || "");
    setReferralName(contact.referralName || "");
    setReferralDate(contact.referralDate || "");
    setIsEditing(false);
  }, [contact]);

  // Update Custom Letter Body whenever template selection or profile changes
  useEffect(() => {
    const template = LETTER_TEMPLATES.find(t => t.id === selectedLetterId);
    if (!template) return;

    let text = template.body;
    text = text.replace(/\[Name\]/g, contact.name);
    text = text.replace(/\[Date\]/g, new Date().toLocaleDateString());
    text = text.replace(/\[DOB\]/g, contact.dob || "—");
    text = text.replace(/\[SSN\]/g, contact.ssn || "—");
    text = text.replace(/\[Address\]/g, contact.address || "—");
    text = text.replace(/\[ReferrerName\]/g, contact.referralName || "Sarah Connor");

    // Compute products list
    const enrolledStr = contact.enrolledProducts && contact.enrolledProducts.length > 0 
      ? contact.enrolledProducts.map((p, i) => `${i+1}. ${p.name} ($${p.contractValue.toLocaleString()} / ${p.billingCycle})`).join("\n")
      : "No active products enrolled.";
    text = text.replace(/\[Products\]/g, enrolledStr);

    const totalValue = contact.enrolledProducts 
      ? contact.enrolledProducts.reduce((sum, p) => sum + p.contractValue, 0)
      : 0;
    text = text.replace(/\[ContractValue\]/g, totalValue.toLocaleString());

    setCustomLetterBody(text);
  }, [selectedLetterId, contact]);

  if (!isOpen) return null;

  // Handle Profile Update
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateContact(contact.id, {
      name,
      email,
      phone,
      company,
      role,
      dob: dob || undefined,
      ssn: ssn || undefined,
      address: address || undefined,
      employer: employer || undefined,
      monthlyIncome: monthlyIncome === "" ? undefined : Number(monthlyIncome),
      referralName: referralName || undefined,
      referralDate: referralDate || undefined
    });
    setIsEditing(false);
  };

  // Family links handlers
  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!famName || !famAge) return;

    const currentLinks = contact.familyLinks || [];
    const newMember: FamilyLink = {
      name: famName,
      relationship: famRel,
      age: Number(famAge),
      social: famSocial || "—"
    };

    await updateContact(contact.id, {
      familyLinks: [...currentLinks, newMember]
    });

    // Reset
    setFamName("");
    setFamAge("");
    setFamSocial("");
  };

  const handleDeleteFamilyMember = async (idx: number) => {
    if (!contact.familyLinks) return;
    const currentLinks = [...contact.familyLinks];
    currentLinks.splice(idx, 1);
    await updateContact(contact.id, {
      familyLinks: currentLinks
    });
  };

  // Product enrollment handlers
  const handleAddProductEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !contractValue) return;

    const currentProducts = contact.enrolledProducts || [];
    const newProduct: EnrolledProduct = {
      productId: `PROD-${Date.now().toString().slice(-4)}`,
      name: selectedProduct,
      enrollmentDate,
      contractValue: Number(contractValue),
      status: enrollmentStatus,
      billingCycle
    };

    const updatedProducts = [...currentProducts, newProduct];
    await updateContact(contact.id, {
      enrolledProducts: updatedProducts
    });

    // Automatic billing workflow: automatically generate an Invoice for the enrolled product!
    await addInvoice({
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      contactName: contact.name,
      status: "Sent",
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 15 days due
      amount: Number(contractValue),
      items: [{
        id: "1",
        description: `Contract Enrollment: ${selectedProduct}`,
        quantity: 1,
        rate: Number(contractValue),
        amount: Number(contractValue)
      }]
    });

    // Reset
    setSelectedProduct("");
    setContractValue("");
  };

  const handleDeleteProductEnrollment = async (productId: string) => {
    if (!contact.enrolledProducts) return;
    const filtered = contact.enrolledProducts.filter(p => p.productId !== productId);
    await updateContact(contact.id, {
      enrolledProducts: filtered
    });
  };

  // Payment received updated invoice handler - uses the updateInvoice helper
  // pulled from the top-level useCRM() hook below (calling hooks inside nested
  // functions is invalid, so all context access happens at the component level).
  const { updateInvoice: ctxUpdateInvoice } = useCRM();

  const handleMarkPaidAndReceipt = async (inv: Invoice) => {
    if (!ctxUpdateInvoice) return;
    
    // 1. Mark Invoice as Paid
    await ctxUpdateInvoice(inv.id, { status: "Paid" });

    // 2. Add Transaction to P&L collection (Manual financial transaction ledger)
    await addFinancialTransaction({
      type: "Income",
      category: "Invoice Collection",
      amount: inv.amount,
      date: new Date().toISOString().split("T")[0],
      description: `Invoice ${inv.invoiceNumber} paid in full by ${contact.name}`
    });

    // 3. Immediately switch to Letter templates and load "Paid In Full" Letter!
    setSelectedLetterId("paid_in_full");
    setActiveTab("letters");
  };

  // Generate copy action
  const handleCopyLetter = () => {
    navigator.clipboard.writeText(customLetterBody);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                {contact.name}
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/50">
                  Client Directory Hub
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{contact.company || "Independent"} — ID: {contact.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="bg-white dark:bg-slate-900 px-6 border-b border-slate-100 dark:border-slate-850 flex flex-wrap gap-1">
          {[
            { id: "profile", label: "Security Profile", icon: <User size={13} /> },
            { id: "family", label: "Family Links", icon: <Users size={13} /> },
            { id: "products", label: "Contracts & Products", icon: <Award size={13} /> },
            { id: "letters", label: "Document Letters (12)", icon: <FileText size={13} /> },
            { id: "billing", label: "Invoices & Payments", icon: <CreditCard size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id 
                  ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-100 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Main Content (Scrollable Grid) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-slate-950/20">
          
          {/* TAB 1: PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-3 mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    <User size={16} className="text-blue-500" />
                    Private Identity Credentials
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-150 px-3 py-1.5 rounded-lg transition"
                  >
                    {isEditing ? "View Mode" : "Edit Profile Info"}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                      <input 
                        type="text" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Date of Birth</label>
                      <input 
                        type="date" 
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Social Security (SSN)</label>
                      <input 
                        type="text" 
                        value={ssn}
                        onChange={(e) => setSsn(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Billing Address</label>
                      <input 
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Current Employer</label>
                      <input 
                        type="text" 
                        value={employer}
                        onChange={(e) => setEmployer(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Monthly Income ($)</label>
                      <input 
                        type="number" 
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value === "" ? "" : Number(e.target.value))}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Referral Agent Name</label>
                      <input 
                        type="text" 
                        value={referralName}
                        onChange={(e) => setReferralName(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Referral Date</label>
                      <input 
                        type="date" 
                        value={referralDate}
                        onChange={(e) => setReferralDate(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg"
                      >
                        Save Security Profile
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Legal Full Name</span>
                      <p className="font-bold text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {contact.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Email Address</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        {contact.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Contact Number</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        {contact.phone || "No phone logged"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Date of Birth (DOB)</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {contact.dob ? new Date(contact.dob).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase flex justify-between w-full">
                        <span>Social Security (SSN)</span>
                        <button 
                          onClick={() => setShowSsn(!showSsn)} 
                          className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                        >
                          {showSsn ? <EyeOff size={11} /> : <Eye size={11} />}
                          {showSsn ? "Hide" : "Reveal Security"}
                        </button>
                      </span>
                      <p className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-950 p-1 px-2.5 rounded-md border border-slate-100 dark:border-slate-850 max-w-max">
                        {contact.ssn 
                          ? (showSsn ? contact.ssn : `XXX-XX-${contact.ssn.slice(-4)}`) 
                          : "No SSN logged"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Home/Billing Address</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {contact.address || "No address logged"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Employer</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {contact.employer || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Monthly Income</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {contact.monthlyIncome ? `$${contact.monthlyIncome.toLocaleString()}` : "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-slate-400 font-semibold uppercase">Referral Agent</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Award size={14} className="text-amber-500" />
                        {contact.referralName || "Sarah Connor"} 
                        {contact.referralDate && <span className="text-[10px] text-slate-400">({new Date(contact.referralDate).toLocaleDateString()})</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FAMILY CONNECTIONS */}
          {activeTab === "family" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Family links list */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
                    <Users size={16} className="text-purple-500" />
                    Family Directory Connections ({contact.familyLinks?.length || 0})
                  </h3>

                  {!contact.familyLinks || contact.familyLinks.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      No family links or dependencies cataloged for this client directory entry.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-850">
                      {contact.familyLinks.map((item, idx) => (
                        <div key={idx} className="py-3 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-850 dark:text-slate-150">{item.name}</p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                              <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                                {item.relationship}
                              </span>
                              <span>Age: <strong className="font-semibold text-slate-600 dark:text-slate-350">{item.age} years</strong></span>
                              <span>SSN: <strong className="font-mono text-slate-600 dark:text-slate-350">XXX-XX-{item.social.slice(-4)}</strong></span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFamilyMember(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add family link form */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
                    <PlusCircle size={15} className="text-blue-500" />
                    Link Family Member
                  </h3>

                  <form onSubmit={handleAddFamilyMember} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-500 uppercase">Member Name *</label>
                      <input 
                        type="text" 
                        required
                        value={famName}
                        onChange={(e) => setFamName(e.target.value)}
                        placeholder="e.g. John Connor"
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-transparent dark:text-slate-100" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-500 uppercase">Relationship *</label>
                        <select
                          value={famRel}
                          onChange={(e) => setFamRel(e.target.value as any)}
                          className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Parent">Parent</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 uppercase">Age *</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          max="120"
                          value={famAge}
                          onChange={(e) => setFamAge(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="e.g. 15"
                          className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-transparent dark:text-slate-100 font-mono" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 uppercase">Social Security Number</label>
                      <input 
                        type="text" 
                        value={famSocial}
                        onChange={(e) => setFamSocial(e.target.value)}
                        placeholder="e.g. XXX-XX-XXXX"
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-transparent dark:text-slate-100 font-mono" 
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                    >
                      Connect & Save Link
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: CONTRACTS & ENROLLED PRODUCTS */}
          {activeTab === "products" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Enrolled products catalog table */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
                    <Award size={16} className="text-amber-500" />
                    Client Contract Catalog & Enrollments ({contact.enrolledProducts?.length || 0})
                  </h3>

                  {!contact.enrolledProducts || contact.enrolledProducts.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      No active product enrollment agreements on this client's profile. Use the form to enroll them.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-850">
                      {contact.enrolledProducts.map((item, idx) => (
                        <div key={item.productId || idx} className="py-3.5 flex justify-between items-start text-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-850 dark:text-slate-100">{item.name}</p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold">
                                {item.productId}
                              </span>
                              <span className="text-emerald-600 font-semibold">
                                ${item.contractValue.toLocaleString()}
                              </span>
                              <span>• {item.billingCycle}</span>
                              <span>• Enrolled: {new Date(item.enrollmentDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                              item.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                              item.status === "Enrolled" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20" :
                              item.status === "Completed" ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20" :
                              "bg-slate-100 text-slate-500"
                            }`}>
                              {item.status}
                            </span>
                            <button
                              onClick={() => handleDeleteProductEnrollment(item.productId)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
                              title="Delete Enrollment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enrollment submission form */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
                    <PlusCircle size={15} className="text-blue-500" />
                    Enroll In Service Product
                  </h3>

                  <form onSubmit={handleAddProductEnrollment} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-500 uppercase">Select Catalog Product *</label>
                      <select
                        required
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="">-- Choose 1 of 40 Products --</option>
                        {PRODUCT_CATALOG.map((prod, i) => (
                          <option key={i} value={prod}>{prod}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-500 uppercase">Contract Value ($) *</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          value={contractValue}
                          onChange={(e) => setContractValue(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="e.g. 1500"
                          className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-transparent dark:text-slate-100 font-mono font-bold" 
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 uppercase">Billing Cycle</label>
                        <select
                          value={billingCycle}
                          onChange={(e) => setBillingCycle(e.target.value as any)}
                          className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
                        >
                          <option value="One-Time">One-Time</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Annual">Annual</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-500 uppercase">Enrollment Date</label>
                        <input 
                          type="date" 
                          required
                          value={enrollmentDate}
                          onChange={(e) => setEnrollmentDate(e.target.value)}
                          className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-transparent dark:text-slate-100" 
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 uppercase">Enrollment Status</label>
                        <select
                          value={enrollmentStatus}
                          onChange={(e) => setEnrollmentStatus(e.target.value as any)}
                          className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
                        >
                          <option value="Enrolled">Enrolled</option>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-2.5 border border-blue-100/50 dark:border-blue-900/30 text-[10px] text-blue-600 dark:text-blue-400">
                      💡 <strong>Smart Workflow Action:</strong> Saving this contract enrollment will automatically generate an outstanding Invoice in our financial system for instant invoice delivery!
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition shadow-xs"
                    >
                      Enact Agreement Contract
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE LETTERS & TEMPLATES ENGINE */}
          {activeTab === "letters" && (
            <div className="space-y-6 animate-fade-in h-[62vh] flex flex-col">
              
              {/* Selector Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Select Interactive Document Letter Template (9-30 letters)
                  </label>
                  <select
                    value={selectedLetterId}
                    onChange={(e) => setSelectedLetterId(e.target.value)}
                    className="mt-1.5 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold bg-white dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    {LETTER_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>[{t.category.toUpperCase()}] {t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto self-end md:self-center">
                  <button
                    onClick={handleCopyLetter}
                    className="flex-1 md:flex-none border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 justify-center cursor-pointer"
                  >
                    <Clipboard size={14} />
                    {isCopied ? "Copied!" : "Copy Letter"}
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const printWindow = window.open("about:blank", "_blank");
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>${LETTER_TEMPLATES.find(t => t.id === selectedLetterId)?.name}</title>
                                <style>
                                  body { font-family: 'Courier New', Courier, monospace; line-height: 1.6; padding: 40px; color: #1e293b; white-space: pre-line; }
                                  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }
                                </style>
                              </head>
                              <body onload="window.print(); window.close();">
                                ${customLetterBody}
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        } else {
                          showToast("Popup blocked! Please allow popups for this site to print.", "error");
                        }
                      } catch (err: any) {
                        console.error("Print popup failed:", err);
                        showToast("Popup blocked or not supported in this sandbox environment.", "error");
                      }
                    }}
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 justify-center shadow-xs cursor-pointer"
                  >
                    <Printer size={14} />
                    Print / Dispatch Letter
                  </button>
                </div>
              </div>

              {/* Editable Area vs Paper Layout Split */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">
                
                {/* Left side: Live Text Editor */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col h-full min-h-0">
                  <span className="block text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider mb-2">
                    Live Document Editor (Editable Plaintext)
                  </span>
                  <textarea
                    value={customLetterBody}
                    onChange={(e) => setCustomLetterBody(e.target.value)}
                    className="flex-1 w-full bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-lg p-3 font-mono text-xs dark:text-slate-100 focus:outline-hidden leading-relaxed resize-none"
                    placeholder="Enter document letter text body here..."
                  />
                </div>

                {/* Right side: Styled Print Preview Paper Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col h-full min-h-0">
                  <span className="block text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider mb-2">
                    Aesthetic Output Stationery Station
                  </span>
                  <div className="flex-1 bg-amber-50/10 dark:bg-slate-950/40 border border-amber-100/30 dark:border-slate-800/80 rounded-lg p-6 overflow-y-auto shadow-inner relative select-text">
                    {/* Decorative Watermark */}
                    <div className="absolute top-4 right-4 text-[9px] font-mono font-bold text-blue-500/35 border border-blue-500/20 rounded px-1.5 py-0.2 select-none uppercase tracking-widest uppercase">
                      Official Document
                    </div>
                    <div className="whitespace-pre-line font-serif text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-w-prose">
                      {customLetterBody}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: INVOICES & PAYMENTS RECONCILIATION */}
          {activeTab === "billing" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
                  <CreditCard size={16} className="text-emerald-500" />
                  Client Invoices & Cashflow Reconciliation
                </h3>

                {clientInvoices.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    No corporate invoices or outstanding payment sheets cataloged for {contact.name}.
                  </div>
                ) : (
                  <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                        <tr>
                          <th className="p-3">Invoice #</th>
                          <th className="p-3">Date Due</th>
                          <th className="p-3">Total Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Operational Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                        {clientInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                            <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-350">{inv.invoiceNumber}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{inv.dueDate || "Immediate"}</td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-150">${Number(inv.amount).toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                                inv.status === "Paid" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" :
                                inv.status === "Overdue" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20" :
                                "bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                              {inv.status !== "Paid" && (
                                <button
                                  onClick={() => handleMarkPaidAndReceipt(inv)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition shadow-xs cursor-pointer flex items-center gap-1"
                                  title="Update Invoice status to Paid and generate Paid In Full Letter!"
                                >
                                  <CheckCircle size={10} />
                                  Reconcile Payment Received
                                </button>
                              )}
                              {inv.status === "Paid" && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
                                  <Check size={11} className="stroke-[3]" /> Reconciled
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <Sparkles size={11} className="text-amber-500 animate-pulse" />
            Automatic client contract tracing & template sync live
          </div>
          <button
            onClick={onClose}
            className="bg-black dark:bg-slate-800 hover:bg-slate-950 text-white font-semibold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Close Client Profile
          </button>
        </div>

      </div>
    </div>
  );
};
