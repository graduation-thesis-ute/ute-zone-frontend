import React, { useState } from "react";
import {
  UserPlus,
  MessageSquare,
  Edit3,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";

interface ManageMembersModalProps {
  isOpen: boolean;
  isCanUpdate: number;
  isCanMessage: number;
  isCanAddMember: number;
  onUpdatePermission: (permissions: {
    canUpdate?: number;
    canMessage?: number;
    canAddMember?: number;
  }) => void;
  onClose: () => void;
  onDisbandGroup: () => void;
}

const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  isCanUpdate,
  isCanMessage,
  isCanAddMember,
  onUpdatePermission,
  onClose,
  onDisbandGroup,
}) => {
  const [showConfirmDisband, setShowConfirmDisband] = useState(false);

  if (!isOpen) return null;

  const handleDisbandClick = () => {
    setShowConfirmDisband(true);
  };

  const handleCancelDisband = () => {
    setShowConfirmDisband(false);
  };

  const handleConfirmDisband = () => {
    onDisbandGroup();
    setShowConfirmDisband(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b dark:border-gray-700 pb-4">
          <div className="flex items-center gap-2">
            <Users className="text-blue-500" size={24} />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Quản lý quyền thành viên
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
          Thiết lập các quyền cho các thành viên trong nhóm chat của bạn
        </p>

        {/* Permission toggles */}
        <div className="space-y-5 mb-8">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                <Edit3 size={18} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  Cập nhật nhóm
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Thay đổi tên và ảnh đại diện
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isCanUpdate === 1}
                onChange={(e) => {
                  onUpdatePermission({
                    canUpdate: e.target.checked ? 1 : 0,
                  });
                }}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                <MessageSquare
                  size={18}
                  className="text-green-600 dark:text-green-300"
                />
              </div>
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  Nhắn tin
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gửi tin nhắn trong nhóm
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isCanMessage === 1}
                onChange={(e) => {
                  onUpdatePermission({
                    canMessage: e.target.checked ? 1 : 0,
                  });
                }}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-md">
                <UserPlus
                  size={18}
                  className="text-purple-600 dark:text-purple-300"
                />
              </div>
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  Thêm thành viên
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mời người khác vào nhóm
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isCanAddMember === 1}
                onChange={(e) => {
                  onUpdatePermission({
                    canAddMember: e.target.checked ? 1 : 0,
                  });
                }}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between pt-4 border-t dark:border-gray-700">
          <button
            onClick={handleDisbandClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors"
          >
            <AlertTriangle size={16} />
            Giải tán nhóm
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Xong
          </button>
        </div>

        {/* Confirmation modal */}
        {showConfirmDisband && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
              <div className="text-center mb-5">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle
                    size={32}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Xác nhận giải tán nhóm?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Hành động này sẽ xóa vĩnh viễn nhóm và tất cả tin nhắn. Bạn
                  không thể hoàn tác hành động này.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDisband}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDisband}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Giải tán
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMembersModal;
