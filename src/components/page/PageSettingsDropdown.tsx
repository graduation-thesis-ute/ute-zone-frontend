import React from 'react';
import {  Edit, Users, Trash2, Globe } from 'lucide-react';

interface PageSettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onAddMember: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isPublished: boolean;
}

const PageSettingsDropdown: React.FC<PageSettingsDropdownProps> = ({
  isOpen,
  onClose,
  onUpdate,
  onAddMember,
  onDelete,
  onToggleStatus,
  isPublished,
}) => {
  if (!isOpen) return null;

  const handleAddMemberClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Add member button clicked');
    onAddMember(e);
    onClose();
  };

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

  const handleToggleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleStatus();
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
        onClick={handleAddMemberClick}
        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <Users size={16} className="mr-2" />
        Thêm thành viên
      </button>
      <button
        onClick={handleToggleStatusClick}
        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <Globe size={16} className={`mr-2 ${isPublished ? 'text-gray-500' : 'text-blue-500'}`} />
        {isPublished ? 'Ẩn trang' : 'Công khai trang'}
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