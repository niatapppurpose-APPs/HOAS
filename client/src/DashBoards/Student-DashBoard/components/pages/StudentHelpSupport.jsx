import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import StudentHeader from '../layout/StudentHeader';
import { createSupportTicket, listUsers } from '../../../../firebase/cloudFunctions';
import {
    HelpCircle, LifeBuoy, MessageCircle, ChevronDown,
    ChevronUp, Send, Loader2, BookOpen, Phone,
    Mail, ExternalLink, FileQuestion, AlertCircle,
    CheckCircle, Search
} from 'lucide-react';

const FAQ_DATA = [
    {
        category: 'Complaints',
        questions: [
            { q: 'How do I file a complaint?', a: 'Navigate to the "Complaints" page from the sidebar. Click the "New Complaint" button, fill in the required details including category, title, description, and optionally attach a photo. Submit the form and your complaint will be sent to the warden.' },
            { q: 'How long does it take for a complaint to be resolved?', a: 'Resolution time depends on the type of issue. Minor maintenance issues are typically resolved within 24-48 hours, while major issues may take up to a week. You can track the status in your complaints dashboard.' },
            { q: 'Can I cancel a complaint after submitting?', a: 'Once a complaint is submitted, it cannot be cancelled. However, you can add notes or updates to your existing complaints by contacting the warden.' },
        ]
    },
    {
        category: 'Leave Requests',
        questions: [
            { q: 'How do I apply for leave?', a: 'Go to the "Leave Requests" page from the sidebar. Click "New Leave Request", select the leave type, enter the start and end dates, provide a reason, and submit. Your request will be reviewed by the warden.' },
            { q: 'Can I cancel a leave request?', a: 'Yes! You can cancel a pending leave request by expanding it in the leave requests list and clicking the "Cancel" button. Once approved or denied, it cannot be cancelled.' },
            { q: 'How will I know if my leave is approved?', a: 'You will receive a notification when your leave request status changes. You can also check the status on the Leave Requests page at any time.' },
        ]
    },
    {
        category: 'Account & Profile',
        questions: [
            { q: 'How do I update my profile information?', a: 'Click on your profile card in the sidebar or navigate to the Profile page. Click the edit button to update your phone number, room number, hostel block, and other details.' },
            { q: 'How do I change my password?', a: 'Go to Settings from the sidebar, then click "Change Password" under the Security section. You will need to enter your current password and then set a new one.' },
            { q: 'Can I change my email address?', a: 'Email addresses cannot be changed as they are linked to your authentication account. Contact your warden or management if you need to update your email.' },
        ]
    },
    {
        category: 'General',
        questions: [
            { q: 'Who can I contact for urgent issues?', a: 'For urgent maintenance issues (water, electricity, safety), use the complaint system with "Urgent" priority. For personal emergencies, contact your warden directly using the contact information on the dashboard.' },
            { q: 'How do I switch between dark and light mode?', a: 'Use the theme toggle button in the top-right corner of the header, or go to Settings → Appearance to switch between dark and light mode.' },
            { q: 'Is my data secure?', a: 'Yes, HOAS uses Firebase Authentication and Firestore security rules to protect your data. Your information can only be accessed by authorized personnel (your assigned warden and management).' },
        ]
    }
];

const StudentHelpSupport = () => {
    const { user, userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const toast = useToast();

    const [expandedFaq, setExpandedFaq] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [showWardens, setShowWardens] = useState(false);
    const [wardens, setWardens] = useState([]);
    const [wardensLoading, setWardensLoading] = useState(true);
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
            toast.success('Support ticket submitted successfully!');
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

    // fetch wardens for contact list
    useEffect(() => {
        if (!userData?.collegeId) return;
        setWardensLoading(true);

        let cancelled = false;

        const load = async () => {
            try {
                const { users } = await listUsers({ role: 'warden' });
                if (cancelled) return;
                const list = (users || []).map(u => ({
                    id: u._id,
                    ...u,
                    fullName: u.name,
                }));
                setWardens(list);
                setWardensLoading(false);
            } catch (err) {
                console.error('Failed to fetch wardens:', err);
                setWardensLoading(false);
            }
        };

        load();

        return () => { cancelled = true; };
    }, [userData?.collegeId]);

    return (
        <>
            <StudentHeader
                title="Help & Support · Student Portal"
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
                        Get answers, submit tickets, and contact support
                    </p>
                </div>

                {/* Quick Actions Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                    <button
                        onClick={() => setShowTicketForm(!showTicketForm)}
                        className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg text-left"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                        <div className="p-2.5 rounded-xl bg-indigo-500/10">
                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Submit a Ticket</p>
                            <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Report an issue or ask a question</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowWardens(v => !v)}
                        className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg text-left"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                        <div className="p-2.5 rounded-xl bg-green-500/10">
                            <Phone className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Contact Warden</p>
                            <p className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>Reach your warden directly</p>
                        </div>
                    </button>

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

                {/* Warden Contact List */}
                {showWardens && (
                    <div className="rounded-2xl border p-6 md:p-8 mb-6 shadow-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary)' }}>
                            <Phone className="inline w-5 h-5 text-green-500 mr-2 -mt-0.5" />
                            Warden Contacts
                        </h3>
                        {wardensLoading ? (
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading wardens...</p>
                        ) : wardens.length === 0 ? (
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No wardens assigned yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {wardens.map(w => (
                                    <div key={w.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{w.fullName || w.displayName || w.email}</p>
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Block: {w.hostelBlock || 'N/A'}</p>
                                        {w.phone && <p className="text-[10px]"><a href={`tel:${w.phone}`} className="underline">{w.phone}</a></p>}
                                        {w.email && <p className="text-[10px]"><a href={`mailto:${w.email}`} className="underline">{w.email}</a></p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Support Ticket Form */}
                {showTicketForm && (
                    <div className="rounded-2xl border p-6 md:p-8 mb-6 shadow-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="text-lg font-black mb-5" style={{ color: 'var(--text-primary)' }}>
                            <MessageCircle className="inline w-5 h-5 text-indigo-500 mr-2 -mt-0.5" />
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
                                    <option value="suggestion">Feature Suggestion</option>
                                    <option value="complaint_system">Complaint System Issue</option>
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
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2">
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
                        placeholder="Search FAQs..."
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
                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                    <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                                        {category.category}
                                    </h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-bold">
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
                                                className="w-full p-4 md:p-5 flex items-center gap-3 text-left hover:bg-indigo-500/5 transition-all"
                                            >
                                                <FileQuestion className="w-4 h-4 text-indigo-500 flex-shrink-0" />
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

export default StudentHelpSupport;