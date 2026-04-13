import { useOutletContext } from 'react-router-dom';
import WardenHeader from '../layout/WardenHeader';
import EmergencyLocationMonitor from '../../../../components/EmergencyLocation/EmergencyLocationMonitor';

const WardenEmergencyLocation = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  return (
    <>
      <WardenHeader
        title="Emergency Locations - Live Monitor"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <EmergencyLocationMonitor title="Student Emergency Live Locations" tone="warden" />
      </div>
    </>
  );
};

export default WardenEmergencyLocation;
