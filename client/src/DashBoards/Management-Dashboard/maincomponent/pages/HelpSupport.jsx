import { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageCircle, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useTheme } from "../../../../context/ThemeContext";

const ManagementHelpSupport = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Content for modals
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

  // Initial dummy FAQs
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
    }
  ];

  const toggleFaq = (id) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Help & Support</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Find answers, documentation, and support for the Management Portal.
          </p>
        </div>
      </div>

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
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                <Mail className="w-4 h-4" />
                Email Tech Support
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm"
                 style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                <Phone className="w-4 h-4" />
                Call Helpline
              </button>

               <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-opacity-80 transition-all font-medium text-sm"
                 style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                <AlertCircle className="w-4 h-4" />
                Report a Bug
              </button>
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                Support Hours: Mon-Fri, 9AM - 6PM EST
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
              className="flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-400 focus:outline-none"
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
              placeholder="Search for help..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)' 
              }}
            />
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
                      <div className="px-6 py-4 pt-0 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200"
                         style={{ 
                           backgroundColor: 'var(--bg-tertiary)',
                           color: 'var(--text-secondary)' 
                         }}>
                        <div className="pt-2 border-t border-dashed border-gray-700/20">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p style={{ color: 'var(--text-secondary)' }}>No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Links / Tiles */}
          <div className="grid grid-cols-2 gap-4">
             <button 
               onClick={() => handleOpenContent('policy')}
               className="p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md focus:outline-none"
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Policy Guide</h4>
             </button>
             <button
               onClick={() => handleOpenContent('rules')}
               className="p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md focus:outline-none"
               style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-1">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Admin Rules</h4>
             </button>
          </div>

        </div>
      </div>

       {/* Topic Content Modal */}
       {selectedTopic && contentMap[selectedTopic] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div 
            className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${contentMap[selectedTopic].color}-100 dark:bg-${contentMap[selectedTopic].color}-900/30`}>
                  {(() => {
                    const Icon = contentMap[selectedTopic].icon;
                    return <Icon className={`w-5 h-5 text-${contentMap[selectedTopic].color}-600 dark:text-${contentMap[selectedTopic].color}-400`} />;
                  })()}
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {contentMap[selectedTopic].title}
                </h2>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
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
    </div>
  );
};

// Helper icon
const ChevronRight = ({ size = 16, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const Shield = ({ className }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

export default ManagementHelpSupport;
