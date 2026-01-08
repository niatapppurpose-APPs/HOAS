import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    college: null,
    wardenCount: 0,
    studentCount: 0,
    onConfirm: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Open delete modal
  const openDeleteModal = ({ college, wardenCount = 0, studentCount = 0, onConfirm }) => {
    setDeleteModal({
      isOpen: true,
      college,
      wardenCount,
      studentCount,
      onConfirm,
    });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      college: null,
      wardenCount: 0,
      studentCount: 0,
      onConfirm: null,
    });
    setIsDeleting(false);
  };

  // Execute delete action
  const confirmDelete = async () => {
    if (deleteModal.onConfirm && typeof deleteModal.onConfirm === 'function') {
      setIsDeleting(true);
      try {
        await deleteModal.onConfirm();
        closeDeleteModal();
      } catch (error) {
        console.error('Delete operation failed:', error);
        setIsDeleting(false);
      }
    }
  };

  const value = {
    // Delete Modal State
    deleteModal,
    isDeleting,
    // Delete Modal Actions
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalContext;
