import { useOutletContext } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';

const Notifications = () => {
  const { isCollapsed } = useOutletContext();
  return (
    <>
      <Header title="Notifications" isCollapsed={isCollapsed} />
      <div className="pt-24 p-6">
        <h1 className="text-2xl font-bold text-white">Notifications Page</h1>
      </div>
    </>
  );
};

export default Notifications;
