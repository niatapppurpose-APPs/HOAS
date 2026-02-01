import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import Header from "../../../components/OwnerServices/header";
import {
    Ticket,
    Bug,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Search,
    Filter,
    Trash2,
    X,
    User,
    Mail,
    Globe,
    FileCode,
    Hash,
    Calendar
} from "lucide-react";
import { HashLoader } from "react-spinners";
import { useTheme } from "../../../context/ThemeContext";

const SupportTickets = () => {
    const { isCollapsed } = useOutletContext();
    const { isDark } = useTheme();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);
    const [showStatusSuccess, setShowStatusSuccess] = useState(false);

    // Fetch tickets from Firestore
    useEffect(() => {
        const q = query(collection(db, "supportTickets"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));
            setTickets(ticketList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tickets:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Update ticket status
    const updateTicketStatus = async (ticketId, newStatus) => {
        setProcessingAction('status-' + newStatus);
        try {
            await updateDoc(doc(db, "supportTickets", ticketId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            setShowStatusSuccess(true);
            setTimeout(() => {
                setShowStatusSuccess(false);
                setProcessingAction(null);
                setSelectedTicket(null); // Back to tickets list
            }, 1000);
        } catch (error) {
            console.error("Error updating ticket:", error);
            setProcessingAction(null);
        }
    };

    // Delete ticket
    const deleteTicket = async (ticketId) => {
        if (window.confirm("Are you sure you want to delete this ticket?")) {
            setProcessingAction('delete');
            try {
                await deleteDoc(doc(db, "supportTickets", ticketId));
                setTimeout(() => {
                    setProcessingAction(null);
                    setSelectedTicket(null);
                }, 500);
            } catch (error) {
                console.error("Error deleting ticket:", error);
                setProcessingAction(null);
            }
        }
    };

    // Filter tickets
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.fileName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
        const matchesType = filterType === "all" || ticket.type === filterType;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Get status badge
    const getStatusBadge = (status) => {
        const styles = {
            open: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
            in_progress: { bg: "bg-blue-100", text: "text-blue-800", icon: AlertTriangle },
            resolved: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
            closed: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle }
        };
        const style = styles[status] || styles.open;
        const Icon = style.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                <Icon className="w-3 h-3" />
                {status?.replace("_", " ").toUpperCase()}
            </span>
        );
    };

    // Get type icon
    const getTypeIcon = (type) => {
        switch (type) {
            case "bug_report": return <Bug className="w-4 h-4 text-red-500" />;
            case "feature_request": return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case "general": return <Ticket className="w-4 h-4 text-purple-500" />;
            default: return <AlertTriangle className="w-4 h-4 text-orange-500" />;
        }
    };

    // Get priority badge
    const getPriorityBadge = (priority) => {
        const colors = {
            high: "bg-red-500",
            medium: "bg-orange-500",
            low: "bg-green-500"
        };
        return (
            <span className={`w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} />
        );
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return "Unknown";
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <>
            <Header title="Support Tickets" isCollapsed={isCollapsed} />

            <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600">
                            <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Support Tickets
                            </h1>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                View and manage all user-reported issues
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3">
                        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                            <span className="text-2xl font-bold text-yellow-500">{tickets.filter(t => t.status === 'open').length}</span>
                            <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>Open</span>
                        </div>
                        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                            <span className="text-2xl font-bold text-green-500">{tickets.filter(t => t.status === 'resolved').length}</span>
                            <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>Resolved</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 rounded-lg outline-none cursor-pointer"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 rounded-lg outline-none cursor-pointer"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="bug_report">Bug Reports</option>
                        <option value="feature_request">Feature Requests</option>
                        <option value="general">General</option>
                    </select>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center min-h-[40vh]">
                        <HashLoader color="var(--accent-primary)" />
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-16 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <Ticket className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            No Tickets Found
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {searchTerm || filterStatus !== "all" || filterType !== "all"
                                ? "No tickets match your filters"
                                : "No support tickets have been submitted yet"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="p-4 rounded-xl cursor-pointer hover:scale-[1.01] transition-all"
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-primary)'
                                }}
                                onClick={() => setSelectedTicket(ticket)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        {getTypeIcon(ticket.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getPriorityBadge(ticket.priority)}
                                            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                {ticket.errorMessage?.substring(0, 60) || "No message"}
                                                {ticket.errorMessage?.length > 60 && "..."}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {ticket.userName || "Anonymous"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileCode className="w-3 h-3" />
                                                {ticket.fileName || "Unknown"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(ticket.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedTicket(null)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl transition-all"
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    {getTypeIcon(selectedTicket.type)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}> Ticket Details </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}> ID: {selectedTicket.id.substring(0, 8)}... </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <X className="w-5 h-5 text-red-500" />
                            </button>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-wrap items-center gap-3 mb-6 bg-gradient-to-r from-gray-500/5 to-transparent p-4 rounded-xl">
                            {getStatusBadge(selectedTicket.status)}

                            <div className="flex gap-2 ml-auto">
                                {selectedTicket.status !== 'resolved' && (
                                    <button
                                        disabled={!!processingAction}
                                        onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center gap-1 transition-all disabled:opacity-50"
                                    >
                                        {processingAction === 'status-resolved' ? (
                                            showStatusSuccess ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />
                                        ) : <CheckCircle className="w-4 h-4" />}
                                        {processingAction === 'status-resolved' && showStatusSuccess ? 'Resolved!' : 'Mark Resolved'}
                                    </button>
                                )}
                                {selectedTicket.status !== 'in_progress' && selectedTicket.status !== 'resolved' && (
                                    <button
                                        disabled={!!processingAction}
                                        onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1 transition-all disabled:opacity-50"
                                    >
                                        {processingAction === 'status-in_progress' ? (
                                            showStatusSuccess ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />
                                        ) : <Clock className="w-4 h-4" />}
                                        {processingAction === 'status-in_progress' && showStatusSuccess ? 'Updated!' : 'In Progress'}
                                    </button>
                                )}
                                <button
                                    disabled={!!processingAction}
                                    onClick={() => deleteTicket(selectedTicket.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 flex items-center gap-1 transition-all disabled:opacity-50"
                                >
                                    {processingAction === 'delete' ? (
                                        <Clock className="w-4 h-4 animate-spin" />
                                    ) : <Trash2 className="w-4 h-4" />}
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedTicket.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span style={{ color: 'var(--text-primary)' }}>{selectedTicket.userEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span style={{ color: 'var(--text-primary)' }}>{selectedTicket.browser}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span style={{ color: 'var(--text-primary)' }}>{formatDate(selectedTicket.createdAt)}</span>
                            </div>
                        </div>

                        {/* Error Details */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Bug className="w-4 h-4" /> Error Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium">
                                        <FileCode className="w-4 h-4" /> {selectedTicket.fileName}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium">
                                        <Hash className="w-4 h-4" /> Line {selectedTicket.lineNumber}
                                    </span>
                                </div>
                                <div className="p-4 rounded-lg bg-gray-900 text-red-400 text-sm font-mono overflow-x-auto shadow-inner">
                                    {selectedTicket.errorMessage}
                                </div>
                            </div>
                        </div>

                        {/* Page URL */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Page URL</h3>
                            <p className="text-sm p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                                {selectedTicket.pageUrl}
                            </p>
                        </div>

                        {/* Additional Info */}
                        {selectedTicket.additionalInfo && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>User's Description</h3>
                                <p className="text-sm p-4 rounded-lg italic border-l-4 border-purple-500" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                    "{selectedTicket.additionalInfo}"
                                </p>
                            </div>
                        )}

                        {/* Stack Trace */}
                        <div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Stack Trace</h3>
                            <pre className="text-xs p-4 rounded-lg bg-gray-900 text-gray-300 overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-gray-700">
                                {selectedTicket.stackTrace}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SupportTickets;
