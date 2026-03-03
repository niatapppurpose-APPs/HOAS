import { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import ManagementHeader from '../../components/layout/ManagementHeader';
import { CONTENT_MAP, FAQS, GETTING_STARTED_STEPS } from './helpSupportData';
import BugReportModal from './BugReportModal';
import TopicContentModal from './TopicContentModal';
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
  Bug,
  Rocket,
  X,
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
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return !localStorage.getItem('hoas_management_help_guide_dismissed');
  });

  const handleDismissGuide = () => {
    setShowGettingStarted(false);
    localStorage.setItem('hoas_management_help_guide_dismissed', 'true');
  };

  const handleOpenContent = useCallback((topic) => setSelectedTopic(topic), []);
  const closeModal = useCallback(() => setSelectedTopic(null), []);
  const closeBugReport = useCallback(() => setShowBugReport(false), []);

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const filteredFaqs = useMemo(() =>
    FAQS.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

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
              {GETTING_STARTED_STEPS.map((step, idx) => {
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
                  onClick={() => { setShowBugReport(true); }}
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
      {selectedTopic && (
        <TopicContentModal
          topic={selectedTopic}
          contentMap={CONTENT_MAP}
          onClose={closeModal}
        />
      )}

      {/* ── Bug Report Modal ── */}
      {showBugReport && (
        <BugReportModal userData={userData} onClose={closeBugReport} />
      )}
    </>
  );
};

export default ManagementHelpSupport;
