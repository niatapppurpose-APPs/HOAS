import {
  FileText,
  Shield,
  Book,
  UserPlus,
  Upload,
  MapPin,
} from 'lucide-react';

// ── Static content for topic modals ──
export const CONTENT_MAP = {
  policy: {
    title: "Policy Guide",
    icon: FileText,
    color: "blue",
    content: (
      <div className="space-y-4">
        <section>
          <h3 className="font-semibold text-lg mb-2">1. Approval Workflow</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm opacity-80">
            <li>All new Warden and Student registrations enter a <strong>Pending</strong> state.</li>
            <li>As a Management user, you are responsible for verifying their identity before approval.</li>
            <li>Avoid denying requests without a valid reason (e.g., invalid ID, duplicate account).</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-lg mb-2">2. Data Privacy</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm opacity-80">
            <li>Student contact information is strictly confidential.</li>
            <li>Access is limited to <strong>Management</strong> and the assigned <strong>Warden</strong> only.</li>
            <li>Do not share login credentials.</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-lg mb-2">3. Hostel Assignments</h3>
          <p className="text-sm opacity-80">Updates to room allocation should be reflected immediately in the system. Ensure capacity limits are not exceeded.</p>
        </section>
      </div>
    )
  },
  rules: {
    title: "Admin Rules",
    icon: Shield,
    color: "purple",
    content: (
      <div className="space-y-4">
        <section>
          <h3 className="font-semibold text-lg mb-2">Hierarchical Access Control</h3>
          <p className="text-sm opacity-80 mb-2">The system follows a strict hierarchy:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm opacity-80">
            <li><strong>Owner (Super Admin)</strong>: Controls all colleges.</li>
            <li><strong>Management (You)</strong>: Administrators for your specific college.</li>
            <li><strong>Warden</strong>: Operational in-charge of hostel blocks.</li>
            <li><strong>Student</strong>: Hostel residents.</li>
          </ol>
        </section>
        <section>
          <h3 className="font-semibold text-lg mb-2">Your Responsibilities</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm opacity-80">
            <li><strong>Response Time</strong>: Aim to process pending approvals within 24 hours.</li>
            <li><strong>Monitoring</strong>: Regularly check the Hostels tab for occupancy stats.</li>
            <li><strong>Reporting</strong>: Generate and review monthly status reports regarding warden performance.</li>
          </ul>
        </section>
      </div>
    )
  },
  manual: {
    title: "Documentation",
    icon: Book,
    color: "emerald",
    content: (
      <div className="space-y-4">
        <section>
          <h3 className="font-semibold text-lg mb-2">Dashboard Overview</h3>
          <p className="text-sm opacity-80">The top section displays 4 Key Performance Indicators (KPIs):</p>
          <ul className="list-disc pl-5 space-y-1 text-sm opacity-80 mt-2">
            <li><strong>Total Wardens</strong>: Active and pending warden counts.</li>
            <li><strong>Total Students</strong>: Active and pending student counts.</li>
            <li><strong>Pending Approvals</strong>: Action items requiring your attention.</li>
            <li><strong>Hostels</strong>: Total number of hostel blocks managed.</li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-lg mb-2">User Management</h3>
          <p className="text-sm opacity-80">Navigate to <strong>Wardens</strong> or <strong>Students</strong> pages to view lists, filter by status, and approve/deny requests.</p>
        </section>
        <section>
          <h3 className="font-semibold text-lg mb-2">Reports</h3>
          <p className="text-sm opacity-80">Use the <strong>Reports</strong> tab to generate PDF/Excel summaries for Attendance, Occupancy, or Incidents.</p>
        </section>
      </div>
    )
  }
};

// ── FAQ data ──
export const FAQS = [
  {
    id: 1,
    question: "How do I approve a new warden?",
    answer: "Navigate to the Wardens section from the sidebar. You'll see a list of pending warden requests. Click on the 'Approve' button next to the warden request you wish to authorize."
  },
  {
    id: 2,
    question: "Can I manage hostel assignments directly?",
    answer: "Yes, go to the Hostels page. You can view current occupancy and assign students to specific rooms or blocks. Wardens typically handle day-to-day assignments, but you have override permissions."
  },
  {
    id: 3,
    question: "How do I generate monthly attendance reports?",
    answer: "Go to the Reports section. Select 'Attendance' from the report type dropdown, choose the date range (e.g., last month), and click 'Generate Report'. You can export this as PDF or Excel."
  },
  {
    id: 4,
    question: "A student is reporting login issues. What should I do?",
    answer: "Verify their status in the Students list. Ensure their account is 'Active' and not 'Pending' or 'Suspended'. If issues persist, verify their email address matches the one registered in the system."
  },
  {
    id: 5,
    question: "How do I bulk upload students?",
    answer: "Go to the Students page and click the 'Bulk Upload' button. Download the CSV template, fill in student details (name, email, room number, etc.), and upload the completed file. The system will create accounts and email login credentials to each student automatically."
  },
  {
    id: 6,
    question: "How do I change the college logo?",
    answer: "Navigate to Settings from the sidebar. In the 'College Logo' section, click the dropzone or drag & drop an image. The logo will be auto-compressed to under 200 KB. Click 'Save Logo' to update it across the dashboard and profile."
  },
  {
    id: 7,
    question: "How do I add a new warden?",
    answer: "Go to the Wardens page and click the 'Add Warden' button. Fill in the warden's details including name, email, phone, and assigned hostel block. The warden will receive an email invitation to set up their account."
  },
  {
    id: 8,
    question: "Where can I see pending approvals?",
    answer: "Pending approvals are shown on the main Dashboard as a KPI card. You can also see them in the Quick Approval section below the stats. Click on any pending item to review and approve/deny it directly."
  }
];

// ── Getting started steps ──
export const GETTING_STARTED_STEPS = [
  { icon: UserPlus, label: "Add your first warden", description: "Go to Wardens → Add Warden" },
  { icon: Upload, label: "Bulk upload students", description: "Go to Students → Bulk Upload" },
  { icon: MapPin, label: "Set your college location", description: "Go to Settings → College Location" },
];
