import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    listAccessRequests,
    reviewAccessRequest,
    createAccountFromAccessRequest,
} from "../../../firebase/cloudFunctions";
import Header from "../../../components/OwnerServices/header";
import {
    Building2,
    Search,
    X,
    User,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    Hotel,
    MessageSquare,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    ShieldCheck,
    UserPlus,
} from "lucide-react";
import { HashLoader } from "react-spinners";

const STATUS_STYLES = {
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800", icon: Clock },
    verified: { label: "Verified", cls: "bg-blue-100 text-blue-700", icon: ShieldCheck },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700", icon: XCircle },
    account_created: { label: "Account Created", cls: "bg-green-100 text-green-700", icon: CheckCircle },
};

const StatusBadge = ({ status }) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
    const Icon = style.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.cls}`}>
            <Icon className="w-3 h-3" />
            {style.label}
        </span>
    );
};

const formatDate = (date) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const AccessRequests = () => {
    const { isCollapsed, setIsCollapsed } = useOutletContext();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchRequests = () => {
        listAccessRequests()
            .then(({ requests: data }) => {
                setRequests(data || []);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching access requests:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        let cancelled = false;
        listAccessRequests()
            .then(({ requests: data }) => {
                if (!cancelled) {
                    setRequests(data || []);
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.error("Error fetching access requests:", error);
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleReview = async (requestId, status) => {
        const notes =
            status === "rejected"
                ? window.prompt("Reason for rejection (sent to the organization):") || ""
                : "";
        setProcessingAction(`review-${requestId}`);
        setActionError("");
        try {
            const updated = await reviewAccessRequest(requestId, { status, notes });
            setRequests((prev) =>
                prev.map((r) => (r._id === requestId ? { ...r, ...updated } : r))
            );
            setSelectedRequest((prev) =>
                prev && prev._id === requestId ? { ...prev, ...updated } : prev
            );
        } catch (error) {
            setActionError(error.message || "Failed to update request");
        } finally {
            setProcessingAction(null);
        }
    };

    const handleCreateAccount = async (requestId) => {
        setProcessingAction(`create-${requestId}`);
        setActionError("");
        try {
            await createAccountFromAccessRequest(requestId);
            setSuccessMessage(
                "Account created! Login credentials have been emailed to the organization."
            );
            setTimeout(() => setSuccessMessage(""), 5000);
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            setActionError(error.message || "Failed to create account");
        } finally {
            setProcessingAction(null);
        }
    };

    const filteredRequests = requests.filter((req) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            req.orgName?.toLowerCase().includes(search) ||
            req.contactPerson?.toLowerCase().includes(search) ||
            req.email?.toLowerCase().includes(search) ||
            req.city?.toLowerCase().includes(search);
        const matchesStatus = filterStatus === "all" || req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = requests.filter((r) => r.status === "pending").length;
    const verifiedCount = requests.filter((r) => r.status === "verified").length;
    const createdCount = requests.filter((r) => r.status === "account_created").length;

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-2">
            <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                    {label}
                </p>
                <p className="text-sm font-medium break-words" style={{ color: "var(--text-primary)" }}>
                    {value || "—"}
                </p>
            </div>
        </div>
    );

    const MessageRow = ({ label, value }) => (
        <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                    {label}
                </p>
                <p className="text-sm font-medium break-words" style={{ color: "var(--text-primary)" }}>
                    {value || "—"}
                </p>
            </div>
        </div>
    );

    return (
        <>
            <Header title="Access Requests" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className="pt-24 px-4 sm:px-6 lg:px-8 py-8">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                                Organization Access Requests
                            </h1>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                Verify organizations and create their management accounts
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                            <span className="text-2xl font-bold text-yellow-500">{pendingCount}</span>
                            <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>Pending</span>
                        </div>
                        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                            <span className="text-2xl font-bold text-blue-500">{verifiedCount}</span>
                            <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>Verified</span>
                        </div>
                        <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                            <span className="text-2xl font-bold text-green-500">{createdCount}</span>
                            <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>Created</span>
                        </div>
                    </div>
                </div>

                {successMessage && (
                    <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 text-green-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> {successMessage}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none"
                            style={{
                                backgroundColor: "var(--bg-card)",
                                border: "1px solid var(--border-primary)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 rounded-lg outline-none cursor-pointer"
                        style={{
                            backgroundColor: "var(--bg-card)",
                            border: "1px solid var(--border-primary)",
                            color: "var(--text-primary)",
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="account_created">Account Created</option>
                    </select>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center min-h-[40vh]">
                        <HashLoader color="var(--accent-primary)" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-16 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                        <Building2 className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                        <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                            No Requests Found
                        </h3>
                        <p style={{ color: "var(--text-muted)" }}>
                            {searchTerm || filterStatus !== "all"
                                ? "No requests match your filters"
                                : "No organization access requests yet"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRequests.map((req) => (
                            <div
                                key={req._id}
                                className="p-4 rounded-xl cursor-pointer hover:scale-[1.01] transition-all"
                                style={{
                                    backgroundColor: "var(--bg-card)",
                                    border: "1px solid var(--border-primary)",
                                }}
                                onClick={() => {
                                    setActionError("");
                                    setSelectedRequest(req);
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-lg bg-violet-500/15">
                                        <Building2 className="w-5 h-5 text-violet-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                            {req.orgName}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" /> {req.contactPerson}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {req.email}
                                            </span>
                                            {req.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {req.city}
                                                    {req.state ? `, ${req.state}` : ""}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {formatDate(req.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <StatusBadge status={req.status} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {selectedRequest && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedRequest(null)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
                        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-primary)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-violet-500/15">
                                    <Building2 className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                                        {selectedRequest.orgName}
                                    </h2>
                                    <div className="mt-1">
                                        <StatusBadge status={selectedRequest.status} />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                style={{ backgroundColor: "var(--bg-tertiary)" }}
                            >
                                <X className="w-5 h-5 text-red-500" />
                            </button>
                        </div>

                        {/* Org details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <InfoRow icon={User} label="Contact Person" value={selectedRequest.contactPerson} />
                            <InfoRow icon={Mail} label="Email" value={selectedRequest.email} />
                            <InfoRow icon={Phone} label="Phone" value={selectedRequest.phone} />
                            <InfoRow
                                icon={MapPin}
                                label="Address"
                                value={[selectedRequest.address, selectedRequest.city, selectedRequest.state, selectedRequest.country]
                                    .filter(Boolean)
                                    .join(", ")}
                            />
                            <InfoRow icon={GraduationCap} label="Students" value={selectedRequest.studentCount ?? "—"} />
                            <InfoRow icon={Hotel} label="Hostels" value={selectedRequest.hostelCount ?? "—"} />
                            <InfoRow icon={Calendar} label="Requested On" value={formatDate(selectedRequest.createdAt)} />
                            <InfoRow icon={ShieldCheck} label="Reviewed At" value={formatDate(selectedRequest.reviewedAt)} />
                        </div>

                        {selectedRequest.message && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                    <MessageSquare className="w-3 h-3" /> Message
                                </p>
                                <p className="text-sm p-3 rounded-lg italic border-l-4 border-violet-500" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                                    "{selectedRequest.message}"
                                </p>
                            </div>
                        )}

                        {actionError && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-semibold">
                                {actionError}
                            </div>
                        )}

                        {/* Actions */}
                        {selectedRequest.status !== "account_created" && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selectedRequest.status !== "verified" && (
                                    <button
                                        disabled={!!processingAction}
                                        onClick={() => handleReview(selectedRequest._id, "verified")}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        {processingAction === `review-${selectedRequest._id}` ? (
                                            <Clock className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4" />
                                        )}
                                        Verify Details
                                    </button>
                                )}
                                {selectedRequest.status !== "rejected" && (
                                    <button
                                        disabled={!!processingAction}
                                        onClick={() => handleReview(selectedRequest._id, "rejected")}
                                        className="px-4 py-2 rounded-lg bg-gray-500/80 text-white text-sm font-medium hover:bg-gray-600 flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                )}
                                <button
                                    disabled={!!processingAction || selectedRequest.status === "pending"}
                                    title={
                                        selectedRequest.status === "pending"
                                            ? "Verify the details first"
                                            : "Creates the management account and emails credentials"
                                    }
                                    onClick={() => handleCreateAccount(selectedRequest._id)}
                                    className="ml-auto px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 flex items-center gap-1.5 transition-all disabled:opacity-40"
                                >
                                    {processingAction === `create-${selectedRequest._id}` ? (
                                        <>
                                            <Clock className="w-4 h-4 animate-spin" /> Creating…
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" /> Create Account & Email Credentials
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        {selectedRequest.status === "account_created" && (
                            <div className="px-4 py-3 rounded-xl bg-green-500/10 text-green-600 text-sm font-semibold flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                Management account created — credentials were emailed to{" "}
                                <strong>{selectedRequest.email}</strong>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AccessRequests;
