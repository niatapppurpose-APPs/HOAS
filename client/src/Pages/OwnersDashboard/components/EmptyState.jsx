import { Users } from "lucide-react";

const EmptyState = ({ activeTab }) => {
  return (
    <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
      <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Users Found</h3>
      <p className="max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
        {activeTab === "pending"
          ? "No pending approvals at the moment."
          : "When users register, they will appear here for your approval."
        }
      </p>
    </div>
  );
};

export default EmptyState;
