import React, { useState } from "react";
import ChatItem from "./ChatItem";
import { Conversation, UserProfile } from "../../models/profile/chat";
import {
  Search,
  Users,
  MessageSquare,
  PlusCircle,
  Loader2,
} from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

interface ChatListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  userCurrent: UserProfile | null;
  handleConversationCreated: () => void;
  loading?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  conversations,
  onSelectConversation,
  userCurrent,
  handleConversationCreated,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleGroupModal = () => {
    setGroupModalOpen(!isGroupModalOpen);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <MessageSquare size={22} className="text-blue-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">Tin nhắn</h2>
        </div>
        <button
          onClick={toggleGroupModal}
          className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium text-sm"
        >
          <PlusCircle size={18} />
          <span>Tạo nhóm</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-gray-50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="w-full py-2.5 pl-10 pr-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Loader2 size={30} className="animate-spin text-blue-500 mb-3" />
            <p className="text-gray-500">Đang tải cuộc trò chuyện...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ChatItem
                key={conversation._id}
                conversation={conversation}
                onClick={() => onSelectConversation(conversation)}
                userCurrent={userCurrent}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
              <MessageSquare size={30} className="text-gray-400" />
            </div>
            {searchQuery ? (
              <>
                <p className="font-medium text-gray-700 mb-1">
                  Không tìm thấy kết quả
                </p>
                <p className="text-gray-500 text-sm">
                  Không tìm thấy cuộc trò chuyện nào phù hợp với "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-700 mb-1">
                  Chưa có cuộc trò chuyện nào
                </p>
                <p className="text-gray-500 text-sm">
                  Bắt đầu cuộc trò chuyện mới hoặc tạo nhóm chat
                </p>
                <button
                  onClick={toggleGroupModal}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Tạo nhóm chat
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <CreateGroupModal
          onClose={() => setGroupModalOpen(false)}
          userCurrent={userCurrent}
          handleConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
};

export default ChatList;
