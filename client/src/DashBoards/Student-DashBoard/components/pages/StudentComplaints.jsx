import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import { FileText, MessageSquare } from 'lucide-react';

const StudentComplaints = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    return (
        <>
            <StudentHeader 
                title="Complaints · Student Portal" 
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <FileText className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Complaints Management
                    </h2>
                    <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
                        File and track your hostel complaints
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">Coming Soon</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentComplaints;