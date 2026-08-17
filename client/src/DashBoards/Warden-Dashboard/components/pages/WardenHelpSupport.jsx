import { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import { createSupportTicket } from '../../../../firebase/cloudFunctions';
import {
    HelpCircle, LifeBuoy, MessageCircle, ChevronDown,
    ChevronUp, Send, Loader2, BookOpen, Phone,
    Mail, FileQuestion, Search
} from 'lucide-react';

const FAQ_DATA = [
    {
        category: 'Complaint Management',
        questions: [
            { q: 'How do I handle a new complaint?', a: 'New complaints appear in your Complaints dashboard. Click on any complaint to view details. You can mark it as "In Progress" when you start working on it, and "Resolved" when the issue is fixed. You can also add a response or resolution note.' },
            { q: 'What happens when I resolve a complaint?', a: 'When you mark a complaint as resolved, the student will be notified and asked to accept or dispute the resolution. If they accept, the complaint is closed. If they dispute, it reopens for further attention.' },
            { q: 'How do I reject a complaint?', a: 'If a complaint is invalid or inappropriate, you can reject it with a reason. The student will be notified of the rejection and the reason provided.' },
            { q: 'Can I reassign a complaint?', a: 'Currently, complaints are assigned to the warden responsible for the student\'s hostel/college. If you need to escalate, contact your management (principal) directly.' },
        ]
    },
    {
        category: 'Student Management',
        questions: [
            { q: 'How do I view my students?', a: 'The Students page shows all students registered under your college/management. You can search by name, room number, student ID, or hostel block. Click on any student to view their full details.' },
            { q: 'How do I track student attendance?', a: 'The attendance feature can be accessed from the dashboard quick actions. It allows you to mark daily hostel presence for your assigned students.' },
            { q: 'What should I do when a new student registers?', a: 'When a new student registers, they will appear with "Pending" status. Management (Principal) handles approvals for new registrations.' },
        ]
    },
    {
        category: 'Announcements',
        questions: [
            { q: 'How do I post an announcement?', a: 'Go to the Announcements page and click "New Post". Enter a title, content, and select a priority level (Urgent, Important, Normal, or Info). You can also pin important announcements to keep them at the top.' },
            { q: 'Who sees my announcements?', a: 'Announcements are visible to all students registered under the same college/management. Only wardens can create, edit, or delete announcements.' },
            { q: 'How do I pin an announcement?', a: 'When creating an announcement, toggle the "Pin to Top" option. You can also pin/unpin existing announcements by expanding them and clicking the pin icon.' },
        ]
    },
    {
        category: 'Leave Requests',
        questions: [
            { q: 'How do I manage student leave requests?', a: 'Leave requests from students appear in the system. You can approve or deny them based on your hostel policies. Each request includes the leave type, dates, reason, destination, and contact information.' },
            { q: 'What if a student cancels their leave?', a: 'Students can cancel pending leave requests themselves. You will see the status change to "Cancelled" in the system. Already approved leaves cannot be cancelled by students.' },
        ]
    },
    {
        category: 'Account & Settings',
        questions: [
            { q: 'How do I change my password?', a: 'Go to Settings from the sidebar, then click "Change Password" under the Security section. Enter your current password and set a new one.' },
            { q: 'How do I update my profile?', a: 'Click on your profile in the sidebar or use the "Edit Profile" button on the dashboard. You can update your phone number, profile photo, and other details.' },
            { q: 'What if I get logged out unexpectedly?', a: 'This can happen due to session expiry or network issues. Simply log back in with your credentials. If you\'re frequently logged out, check your internet connection or contact support.' },
        ]
    }
];

const WardenHelpSupport = () => {
    const { user, userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();

    const [expandedFaq, setExpandedFaq] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [ticketData, setTicketData] = useState({
        subject: '',
        description: '',
        category: 'general',
    });

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        if (!ticketData.subject || !ticketData.description) {
            toast.error('Please fill in subject and description');
            return;
        }

        setSubmitting(true);
        try {
            await createSupportTicket({
                ...ticketData,
                priority: 'medium',
            });
            toast.success('Support ticket submitted!');
            setTicketData({ subject: '', description: '', category: 'general' });
            setShowTicketForm(false);
        } catch (err) {
            console.error('Ticket submit error:', err);
            toast.error('Failed to submit support ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredFAQs = searchQuery
        ? FAQ_DATA.map(cat => ({
            ...cat,
            questions: cat.questions.filter(
                q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    q.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0)
        : FAQ_DATA;

    return (
        <>
            <WardenHeader
                title="Help & Support · Warden Portal"
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                        <LifeBuoy className="inline w-6 h-6 text-indigo-500 mr-2 -mt-1" />
                        Help & Support
                    </h2>
                    <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                        Documentation, FAQs, and support resources for wardens
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                    <button
                        onClick={() => setShowTicketForm(!showTicketForm)}
                        className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg text-left"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                        <div className="p-2.5 rounded-xl bg-orange-500/10">
                            <MessageCircle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Submit a Ticket</p>
                            <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Report technical issues</p>
                        </div>
                    </button>

                    <div className="flex items-center gap-3 p-4 rounded-2xl border"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="p-2.5 rounded-xl bg-green-500/10">
                            <Phone className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Contact Management</p>
                            <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Reach your principal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-2xl border"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <div className="p-2.5 rounded-xl bg-blue-500/10">
                            <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Email Support</p>
                            <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>support@hoas.app</p>
                        </div>
                    </div>
                </div>

                {/* Ticket Form */}
                {showTicketForm && (
                    <div className="rounded-2xl border p-6 md:p-8 mb-6 shadow-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="text-lg font-black mb-5" style={{ color: 'var(--text-primary)' }}>
                            <MessageCircle className="inline w-5 h-5 text-orange-500 mr-2 -mt-0.5" />
                            New Support Ticket
                        </h3>

                        <form onSubmit={handleSubmitTicket} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
                                <select
                                    value={ticketData.category}
                                    onChange={(e) => setTicketData(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                >
                                    <option value="general">General Inquiry</option>
                                    <option value="technical">Technical Issue</option>
                                    <option value="account">Account Problem</option>
                                    <option value="complaint_system">Complaint System Issue</option>
                                    <option value="student_management">Student Management</option>
                                    <option value="suggestion">Feature Suggestion</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Subject *</label>
                                <input
                                    type="text"
                                    value={ticketData.subject}
                                    onChange={(e) => setTicketData(p => ({ ...p, subject: e.target.value }))}
                                    placeholder="Brief summary of your issue"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Description *</label>
                                <textarea
                                    value={ticketData.description}
                                    onChange={(e) => setTicketData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Describe the issue in detail..."
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowTicketForm(false)}
                                    className="px-5 py-2.5 rounded-xl border text-sm font-bold"
                                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* FAQ Search */}
                <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documentation and FAQs..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border text-sm"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                </div>

                {/* FAQ Sections */}
                <div className="space-y-5">
                    {filteredFAQs.map((category, catIdx) => (
                        <div key={catIdx} className="rounded-2xl border overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            <div className="p-4 md:p-5 border-b" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-orange-500" />
                                    <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                                        {category.category}
                                    </h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-bold">
                                        {category.questions.length}
                                    </span>
                                </div>
                            </div>

                            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {category.questions.map((faq, faqIdx) => {
                                    const faqKey = `${catIdx}-${faqIdx}`;
                                    const isExpanded = expandedFaq === faqKey;

                                    return (
                                        <div key={faqIdx}>
                                            <button
                                                onClick={() => setExpandedFaq(isExpanded ? null : faqKey)}
                                                className="w-full p-4 md:p-5 flex items-center gap-3 text-left hover:bg-orange-500/5 transition-all"
                                            >
                                                <FileQuestion className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{faq.q}</span>
                                                {isExpanded
                                                    ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                                                    : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                                                }
                                            </button>
                                            {isExpanded && (
                                                <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 ml-7">
                                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                            {faq.a}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default WardenHelpSupport;