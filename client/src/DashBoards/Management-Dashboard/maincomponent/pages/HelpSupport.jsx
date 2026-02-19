import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import ManagementHeader from '../../components/layout/ManagementHeader';
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Shield,
  FileText,
  AlertCircle,
  Bug,
  CheckCircle2,
  Rocket,
  Users,
  Upload,
  MapPin,
  UserPlus,
  X,
  Send,
  Loader2,
  Info
} from 'lucide-react';

const ManagementHelpSupport = () => {
  const { isDark } = useTheme();
  const { userData } = useAuth();
  const { isCollapsed } = useOutletContext();

  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return !localStorage.getItem('hoas_management_help_guide_dismissed');
  });

  const handleDismissGuide = () => {
    setShowGettingStarted(false);
    localStorage.setItem('hoas_management_help_guide_dismissed', 'true');
  };

  // ── Content for modals ──
  const contentMap = {
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

  const handleOpenContent = (topic) => {
    setSelectedTopic(topic);
  };

  const closeModal = () => {
    setSelectedTopic(null);
  };

  // ── FAQs ──
  const faqs = [
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

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Bug report handler ──
  const handleBugSubmit = () => {
    if (!bugDescription.trim()) return;
    setBugSubmitting(true);
    // Simulate submission (no backend)
    setTimeout(() => {
      setBugSubmitting(false);
      setBugSubmitted(true);
      setTimeout(() => {
        setShowBugReport(false);
        setBugSubmitted(false);
        setBugDescription('');
      }, 2000);
    }, 1200);
  };

  // ── Getting Started steps ──
  const gettingStartedSteps = [
    { icon: UserPlus, label: "Add your first warden", description: "Go to Wardens → Add Warden" },
    { icon: Upload, label: "Bulk upload students", description: "Go to Students → Bulk Upload" },
    { icon: MapPin, label: "Set your college location", description: "Go to Settings → College Location" },
  ];

  return (
    <>
      <ManagementHeader
        title="Help & Support"
        isCollapsed={isCollapsed}
      />

      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        {/* Page Header */}
        <div className="mb-6">
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Help & Support
          </h2>
          <p
            className="mt-2 text-sm md:text-base"
            style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
          >
            Find answers, documentation, and support for the Management Portal.
          </p>
        </div>

        {/* Getting Started Guide */}
        {showGettingStarted && (
          <div
            className="mb-6 rounded-2xl border p-5 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              background: isDark
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.03))',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismissGuide}
              className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
                <Rocket className="w-5 h-5" style={{ color: 'var(--accent-primary, #6366f1)' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Getting Started</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quick steps to set up your college portal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {gettingStartedSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{step.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Navigation & Contact */}
          <div className="lg:col-span-1 space-y-6">

            {/* Support Actions Card */}
            <div className="rounded-xl p-5 shadow-sm border transition-colors duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}>
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <MessageCircle className="w-5 h-5 text-indigo-500" />
                Contact Support
              </h3>

              <div className="space-y-3">
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=niatapppurpose@gmail.com"
                  target='_blank'
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm cursor-pointer group"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}
                >
                  <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Email Tech Support
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                <a
                  href="tel:+911234567890"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm cursor-pointer group"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}
                >
                  <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Call Helpline
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                <button
                  onClick={() => { setShowBugReport(true); setBugSubmitted(false); setBugDescription(''); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm cursor-pointer group"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                >
                  <Bug className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Report a Bug
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Support Hours: Mon–Fri, 9 AM – 6 PM IST
                </p>
              </div>
            </div>

            {/* User Guides Link */}
            <div className="rounded-xl p-5 shadow-sm border transition-colors duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}>
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Book className="w-5 h-5 text-emerald-500" />
                Documentation
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Detailed guides on managing hostels, users, and generating reports.
              </p>
              <button
                onClick={() => handleOpenContent('manual')}
                className="flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-400 focus:outline-none transition-colors"
              >
                View User Manual <ChevronRight size={16} />
              </button>
            </div>

          </div>

          {/* Right Column: FAQ & Interactions */}
          <div className="lg:col-span-2 space-y-6">

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* FAQs List */}
            <div className="rounded-xl shadow-sm border overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  Frequently Asked Questions
                  <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                    {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
                  </span>
                </h2>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => (
                    <div key={faq.id} className="group">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-opacity-50 transition-colors"
                        style={{
                          backgroundColor: expandedFaq === faq.id ? 'var(--bg-tertiary)' : 'transparent'
                        }}
                      >
                        <span className="font-medium text-sm md:text-base pr-4" style={{ color: 'var(--text-primary)' }}>
                          {faq.question}
                        </span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="w-5 h-5 flex-shrink-0 text-indigo-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                        )}
                      </button>

                      {expandedFaq === faq.id && (
                        <div className="px-6 py-4 pt-0 text-sm leading-relaxed"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}>
                          <div className="pt-2 border-t border-dashed" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                            {faq.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No results found</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try a different search term for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links / Tiles */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleOpenContent('policy')}
                className="p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md focus:outline-none group"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }}>
                  <FileText className="w-5 h-5" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
                </div>
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Policy Guide</h4>
              </button>
              <button
                onClick={() => handleOpenContent('rules')}
                className="p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md focus:outline-none group"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)' }}>
                  <Shield className="w-5 h-5" style={{ color: isDark ? '#c084fc' : '#9333ea' }} />
                </div>
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Admin Rules</h4>
              </button>
            </div>

          </div>
        </div>

        {/* App Info Footer */}
        <div className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                HOAS v1.0 · Hostel Operation Accountability System
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} HOAS. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── Topic Content Modal ── */}
      {selectedTopic && contentMap[selectedTopic] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{
                  backgroundColor: isDark
                    ? `rgba(${contentMap[selectedTopic].color === 'blue' ? '59,130,246' : contentMap[selectedTopic].color === 'purple' ? '168,85,247' : '16,185,129'}, 0.15)`
                    : `rgba(${contentMap[selectedTopic].color === 'blue' ? '59,130,246' : contentMap[selectedTopic].color === 'purple' ? '168,85,247' : '16,185,129'}, 0.1)`
                }}>
                  {(() => {
                    const Icon = contentMap[selectedTopic].icon;
                    const colorVal = contentMap[selectedTopic].color === 'blue' ? '#3b82f6' : contentMap[selectedTopic].color === 'purple' ? '#a855f7' : '#10b981';
                    return <Icon className="w-5 h-5" style={{ color: colorVal }} />;
                  })()}
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {contentMap[selectedTopic].title}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto" style={{ color: 'var(--text-secondary)' }}>
              {contentMap[selectedTopic].content}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bug Report Modal ── */}
      {showBugReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => { if (!bugSubmitting) setShowBugReport(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <Bug className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Report a Bug</h2>
              </div>
              <button
                onClick={() => setShowBugReport(false)}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                disabled={bugSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {bugSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Bug Report Submitted!</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Thank you for helping us improve HOAS. We'll review your report shortly.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Describe the issue you're experiencing. Include steps to reproduce if possible.
                  </p>
                  <textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder="Describe the bug in detail..."
                    rows={5}
                    className="w-full rounded-xl border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Your report will include your name ({userData?.displayName || 'N/A'}) and college ({userData?.collegeName || 'N/A'}) for context.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!bugSubmitted && (
              <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <button
                  onClick={() => setShowBugReport(false)}
                  disabled={bugSubmitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBugSubmit}
                  disabled={bugSubmitting || !bugDescription.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: bugDescription.trim() ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-tertiary)',
                    boxShadow: bugDescription.trim() ? '0 4px 15px rgba(239, 68, 68, 0.3)' : 'none',
                    color: bugDescription.trim() ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {bugSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Report</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ManagementHelpSupport;
