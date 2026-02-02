import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import { Settings, Wrench } from 'lucide-react';

const StudentSettings = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    return (
        <>
            <StudentHeader 
                title="Settings · Student Portal" 
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <Settings className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Account Settings
                    </h2>
                    <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
                        Manage your profile, preferences and privacy settings
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/10 text-gray-600">
                        <Wrench className="w-4 h-4" />
                        <span className="text-sm">Coming Soon</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentSettings;