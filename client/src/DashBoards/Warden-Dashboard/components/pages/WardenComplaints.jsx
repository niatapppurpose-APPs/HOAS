import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import WardenHeader from '../layout/WardenHeader';
import { FileText, MessageSquare } from 'lucide-react';

const WardenComplaints = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    return (
        <>
            <WardenHeader 
                title="Complaints · Warden Portal" 
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <FileText className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Complaint Management
                    </h2>
                    <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
                        Review and resolve student complaints
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">Coming Soon</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WardenComplaints;