import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import WardenHeader from '../layout/WardenHeader';
import { Users, GraduationCap } from 'lucide-react';

const WardenStudents = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    return (
        <>
            <WardenHeader 
                title="Students · Warden Portal" 
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <Users className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Student Management
                    </h2>
                    <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
                        View and manage all students in your hostel
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-600">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm">Coming Soon</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WardenStudents;