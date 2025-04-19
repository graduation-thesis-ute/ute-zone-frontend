import React from "react";
import { X, Crown, UserMinus, User, Search, Loader } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = React.useState("");

  if (!isOpen) return null;

  const filteredMembers = searchTerm
    ? membersList.filter((member) =>
        member.user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : membersList;

  // Sort members with owner first
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (a.isOwner === 1 && b.isOwner !== 1) return -1;
    if (a.isOwner !== 1 && b.isOwner === 1) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[32rem] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Danh sách thành viên ({membersList.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm thành viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Members List */}
        <div className="overflow-y-auto flex-1 px-3">
          {loadingMembers ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
              <Loader size={24} className="animate-spin mb-2" />
              <p>Đang tải danh sách thành viên...</p>
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
              <p>Không tìm thấy thành viên nào</p>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {sortedMembers.map((member) => {
                const isCurrentUser = member.user._id === profile?._id;
                const isGroupOwner = member.isOwner === 1;
                const canDelete =
                  isOwner === 1 && !isGroupOwner && membersList.length > 3;

                return (
                  <div
                    key={member._id}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isCurrentUser ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div
                      className="flex items-center flex-1 min-w-0 cursor-pointer"
                      onClick={() => onAvatarClick(member.user)}
                    >
                      <div className="relative">
                        <img
                          src={member.user.avatarUrl || UserIcon}
                          alt={member.user.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                        />
                        {isGroupOwner && (
                          <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full">
                            <Crown size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {member.user.displayName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-normal text-blue-500 dark:text-blue-400">
                              (Tôi)
                            </span>
                          )}
                        </p>
                        {isGroupOwner && (
                          <p className="text-xs text-amber-500 dark:text-amber-400">
                            Nhóm trưởng
                          </p>
                        )}
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => onDeleteMember(member._id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        title="Xóa thành viên"
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberListModal;
