import React, { useState, useEffect } from "react";
import { Search, MessageSquare, PlusCircle, Loader2 } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { v4 as uuidv4 } from "uuid";

interface ChatbotListProps {
  onSelectConversation: (conversation: any) => void;
  userCurrent: any;
  handleConversationCreated: () => void;
  loading?: boolean;
}

const ChatbotList: React.FC<ChatbotListProps> = ({
  onSelectConversation,
  userCurrent,
  handleConversationCreated,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const { get, post } = useFetch();

  useEffect(() => {
    fetchConversations();
  }, [get]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const history = await get("/v1/chatbot/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formattedConversations = history.map((convo: any) => ({
        id: convo.conversationId,
        date: new Date(convo.createdAt).toLocaleDateString("vi-VN"),
        title: convo.title,
      }));

      setConversations(formattedConversations);
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConversationId = uuidv4();
      await post("/v1/chatbot/conversation/new", {
        conversationId: newConversationId,
      });

      const newConversation = {
        id: newConversationId,
        date: new Date().toLocaleDateString("vi-VN"),
        title: "Cuộc trò chuyện mới",
      };

      setConversations((prev) => [newConversation, ...prev]);
      onSelectConversation(newConversation);
      handleConversationCreated();
    } catch (err: any) {
      console.error("Error creating new chat:", err);
    }
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <MessageSquare size={22} className="text-blue-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">Chatbot</h2>
        </div>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium text-sm"
        >
          <PlusCircle size={18} />
          <span>Cuộc trò chuyện mới</span>
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
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
              >
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <span className="mr-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      ></path>
                    </svg>
                  </span>
                  <span>{conversation.date}</span>
                </div>
                <div className="text-gray-700 truncate pl-6">
                  {conversation.title}
                </div>
              </div>
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
                  Bắt đầu cuộc trò chuyện mới với chatbot
                </p>
                <button
                  onClick={handleNewChat}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Cuộc trò chuyện mới
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotList;
