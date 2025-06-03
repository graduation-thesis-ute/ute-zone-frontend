import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface PageSettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const PageSettingsDropdown: React.FC<PageSettingsDropdownProps> = ({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  if (!isOpen) return null;

  const handleUpdateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate();
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
    onClose();
  };

  return (
    <div 
      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleUpdateClick}
        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <Edit size={16} className="mr-2" />
        Cập nhật thông tin
      </button>
      <button
        onClick={handleDeleteClick}
        className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
      >
        <Trash2 size={16} className="mr-2" />
        Xóa trang
      </button>
    </div>
  );
};

export default PageSettingsDropdown; 