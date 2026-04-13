import { useOutletContext } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import EmergencyLocationShareCard from '../../../../components/EmergencyLocation/EmergencyLocationShareCard';

const StudentEmergencyLocation = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  return (
    <>
      <StudentHeader
        title="Emergency Location - Safety"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <EmergencyLocationShareCard tone="student" />
      </div>
    </>
  );
};

export default StudentEmergencyLocation;
