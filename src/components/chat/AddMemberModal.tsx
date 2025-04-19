import React from "react";
import { Friends } from "../../models/profile/chat";
import { Search, UserPlus, X, Check, Users, Loader2 } from "lucide-react";
import UserIcon from "../../assets/user_icon.png";

interface AddMemberModalProps {
  isOpen: boolean;
  searchQuery: string;
  friends: Friends[];
  selectedMembers: string[];
  conversationMembersIdList: string[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMember: (userId: string) => void;
  onClose: () => void;
  onAddMember: () => void;
  loading?: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  searchQuery,
  friends,
  selectedMembers,
  conversationMembersIdList,
  onSearchChange,
  onToggleMember,
  onClose,
  onAddMember,
  loading = false,
}) => {
  if (!isOpen) return null;

  const filteredFriends = friends.filter((friend) =>
    friend.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lấy số lượng thành viên đã chọn mà chưa có trong nhóm
  const newMembersCount = selectedMembers.filter(
    (memberId) => !conversationMembersIdList.includes(memberId)
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center">
            <UserPlus size={20} className="mr-2" />
            <h3 className="text-xl font-bold">Thêm thành viên</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-blue-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Search input */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchQuery}
              onChange={onSearchChange}
            />
          </div>

          {/* Selected members count */}
          {selectedMembers.length > 0 && (
            <div className="flex items-center mb-3 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <Check size={16} className="mr-2" />
              Đã chọn {newMembersCount} thành viên mới
            </div>
          )}

          {/* Friends list */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={24}
                  className="animate-spin text-blue-500 mr-2"
                />
                <span className="text-gray-600">
                  Đang tải danh sách bạn bè...
                </span>
              </div>
            ) : filteredFriends.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                {filteredFriends.map((friend) => {
                  const isAlreadyInConversation =
                    conversationMembersIdList.includes(friend.friend._id);

                  return (
                    <div
                      key={friend._id}
                      className={`flex items-center px-4 py-3 hover:bg-gray-100 transition-colors ${
                        isAlreadyInConversation
                          ? "opacity-60"
                          : "cursor-pointer"
                      } ${
                        selectedMembers.includes(friend.friend._id) &&
                        !isAlreadyInConversation
                          ? "bg-blue-50"
                          : ""
                      }`}
                      onClick={() =>
                        !isAlreadyInConversation &&
                        onToggleMember(friend.friend._id)
                      }
                    >
                      <div className="flex-shrink-0 mr-3">
                        <img
                          src={friend.friend.avatarUrl || UserIcon}
                          alt={friend.friend.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {friend.friend.displayName}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isAlreadyInConversation ? (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            Đã tham gia
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(
                              friend.friend._id
                            )}
                            onChange={() => onToggleMember(friend.friend._id)}
                            className="w-5 h-5 accent-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Users size={32} className="text-gray-400 mb-2" />
                <p className="text-gray-500">Không tìm thấy bạn bè nào</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              onClick={onAddMember}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={loading || newMembersCount === 0}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <UserPlus size={18} className="mr-2" />
                  Thêm thành viên
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
