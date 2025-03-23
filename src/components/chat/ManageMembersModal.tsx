import React from "react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-semibold mb-4">
          Cho phép các thành viên trong nhóm:
        </h3>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="toggleUpdateAll"
            checked={isCanUpdate === 1}
            onChange={(e) => {
              onUpdatePermission({
                canUpdate: e.target.checked ? 1 : 0,
              });
            }}
          />
          <label htmlFor="toggleUpdateAll" className="ml-2">
            Có thể cập nhật tên và avatar của nhóm
          </label>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="toggleMessageAll"
            checked={isCanMessage === 1}
            onChange={(e) => {
              onUpdatePermission({
                canMessage: e.target.checked ? 1 : 0,
              });
            }}
          />
          <label htmlFor="toggleMessageAll" className="ml-2">
            Có thể nhắn tin trong nhóm
          </label>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="toggleAddMemberAll"
            checked={isCanAddMember === 1}
            onChange={(e) => {
              onUpdatePermission({
                canAddMember: e.target.checked ? 1 : 0,
              });
            }}
          />
          <label htmlFor="toggleAddMemberAll" className="ml-2">
            Có thể thêm thành viên vào nhóm
          </label>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={onDisbandGroup}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Giải tán nhóm
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageMembersModal;
