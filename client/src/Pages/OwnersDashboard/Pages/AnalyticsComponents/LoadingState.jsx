import { HashLoader } from 'react-spinners';

const LoadingState = () => {
  return (
    <div className="flex items-center justify-center h-96">
      <HashLoader color="#3b82f6" size={60} />
    </div>
  );
};

export default LoadingState;
