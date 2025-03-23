import React from "react";
import UserIcon from "../../assets/user_icon.png";
import { ConversationMembers } from "../../models/profile/chat";
import { useProfile } from "../../types/UserContext";

interface MemberListModalProps {
  isOpen: boolean;
  membersList: ConversationMembers[];
  loadingMembers: boolean;
  isOwner: number;
  onClose: () => void;
  onDeleteMember: (memberId: string) => void;
  onAvatarClick: (user: any) => void;
}

const MemberListModal: React.FC<MemberListModalProps> = ({
  isOpen,
  membersList,
  loadingMembers,
  isOwner,
  onClose,
  onDeleteMember,
  onAvatarClick,
}) => {
  const { profile } = useProfile();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Danh sách thành viên</h3>
        {loadingMembers ? (
          <p>Đang tải danh sách...</p>
        ) : (
          <div className="space-y-4">
            {membersList.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <img
                    src={member.user.avatarUrl || UserIcon}
                    alt={member.user.displayName}
                    className="w-8 h-8 rounded-full mr-2"
                    onClick={() => onAvatarClick(member.user)}
                  />
                  <span className="text-gray-700">
                    {member.user.displayName}
                    {member.user._id === profile?._id && (
                      <span className="ml-2 text-sm text-gray-500">(Tôi)</span>
                    )}
                  </span>
                </div>

                {isOwner === 1 ? (
                  member.isOwner === 1 ? (
                    <span className="text-sm text-blue-500">Nhóm trưởng</span>
                  ) : (
                    membersList.length > 3 && (
                      <button
                        onClick={() => onDeleteMember(member._id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    )
                  )
                ) : (
                  member.isOwner === 1 && (
                    <span className="text-sm text-blue-500">Nhóm trưởng</span>
                  )
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberListModal;
