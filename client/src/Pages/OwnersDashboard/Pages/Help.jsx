import { useOutletContext } from 'react-router-dom';
import Header from '../../../components/OwnerServices/header';

const Help = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  return (
    <>
      <Header title="Help & Support" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="pt-24 p-6">
        <h1 className="text-2xl font-bold text-white">Help & Support Page</h1>
      </div>
    </>
  );
};

export default Help;
