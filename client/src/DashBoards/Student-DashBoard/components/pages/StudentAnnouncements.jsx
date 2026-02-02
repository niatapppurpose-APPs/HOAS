import { useAuth } from '../../../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import { Bell, Megaphone } from 'lucide-react';

const StudentAnnouncements = () => {
    const { userData } = useAuth();
    const { isCollapsed, setIsCollapsed } = useOutletContext();

    return (
        <>
            <StudentHeader 
                title="Announcements · Student Portal" 
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            
            <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <Bell className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                    <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Announcements & Notices
                    </h2>
                    <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
                        Stay updated with important hostel announcements
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-600">
                        <Megaphone className="w-4 h-4" />
                        <span className="text-sm">Coming Soon</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentAnnouncements;