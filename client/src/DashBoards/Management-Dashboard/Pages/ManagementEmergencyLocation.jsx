import { useOutletContext } from 'react-router-dom';
import ManagementHeader from '../components/layout/ManagementHeader';
import EmergencyLocationMonitor from '../../../components/EmergencyLocation/EmergencyLocationMonitor';

const ManagementEmergencyLocation = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  return (
    <>
      <ManagementHeader
        title="Emergency Locations - Response View"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <EmergencyLocationMonitor title="Emergency Live Student Locations" tone="management" />
      </div>
    </>
  );
};

export default ManagementEmergencyLocation;
