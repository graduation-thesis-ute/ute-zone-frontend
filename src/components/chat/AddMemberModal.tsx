import React from "react";
import { Friends } from "../../models/profile/chat";

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
}) => {
  if (!isOpen) return null;

  const filteredFriends = friends.filter((friend) =>
    friend.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-semibold mb-4">Thêm thành viên</h3>

        <input
          type="text"
          placeholder="Tìm kiếm bạn bè..."
          className="w-full p-2 mb-4 border rounded focus:outline-none"
          value={searchQuery}
          onChange={onSearchChange}
        />

        <div className="max-h-60 overflow-y-auto">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => {
              const isAlreadyInConversation =
                conversationMembersIdList.includes(friend.friend._id);

              return (
                <div
                  key={friend._id}
                  className="flex items-center justify-between mb-2"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={friend._id}
                      checked={selectedMembers.includes(friend.friend._id)}
                      onChange={() => onToggleMember(friend.friend._id)}
                      className="mr-2"
                      disabled={isAlreadyInConversation}
                    />
                    <label
                      htmlFor={friend._id}
                      className={isAlreadyInConversation ? "text-gray-500" : ""}
                    >
                      {friend.friend.displayName}
                    </label>
                  </div>

                  {isAlreadyInConversation && (
                    <p className="text-gray-500 ml-auto">Đã tham gia</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">Không tìm thấy bạn bè nào</p>
          )}
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onAddMember}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
