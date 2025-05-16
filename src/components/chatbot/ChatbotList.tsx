import React, { useState, useEffect } from "react";
import {
  Search,
  MessageSquare,
  PlusCircle,
  Loader2,
  X,
  Clock,
  Trash2,
} from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { v4 as uuidv4 } from "uuid";
import { ConfimationDialog } from "../Dialog";

interface ChatbotListProps {
  onSelectConversation: (conversation: any) => void;
  userCurrent: any;
  handleConversationCreated: () => void;
  loading?: boolean;
}

const ChatbotList: React.FC<ChatbotListProps> = ({
  onSelectConversation,
  handleConversationCreated,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const { get, post, del } = useFetch();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

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
        timestamp: new Date(convo.createdAt).getTime(),
      }));

      // Sort conversations by timestamp (newest first)
      formattedConversations.sort(
        (a: any, b: any) => b.timestamp - a.timestamp
      );
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
        timestamp: new Date().getTime(),
      };

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversation(newConversationId);
      onSelectConversation(newConversation);
      handleConversationCreated();
    } catch (err: any) {
      console.error("Error creating new chat:", err);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation.id);
    onSelectConversation(conversation);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    try {
      setDeletingId(conversationToDelete);
      const token = localStorage.getItem("accessToken");
      await del(`/v1/chatbot/conversation/${conversationToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove the deleted conversation from the list
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationToDelete)
      );

      // If the deleted conversation was active, clear the selection
      if (activeConversation === conversationToDelete) {
        setActiveConversation(null);
        onSelectConversation(null);
      }
    } catch (err: any) {
      console.error("Error deleting conversation:", err);
      alert("Không thể xóa cuộc trò chuyện. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setConversationToDelete(null);
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date to show as "Today" or "Yesterday" when applicable
  const formatDate = (dateStr: string) => {
    const today = new Date().toLocaleDateString("vi-VN");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("vi-VN");

    if (dateStr === today) return "Hôm nay";
    if (dateStr === yesterdayStr) return "Hôm qua";
    return dateStr;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <MessageSquare size={22} className="text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Chatbot</h2>
        </div>
        <button
          onClick={handleNewChat}
          className="px-3 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 flex items-center gap-1.5 font-medium text-sm shadow-sm hover:shadow"
        >
          <PlusCircle size={18} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-gray-50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="w-full py-2.5 pl-10 pr-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfimationDialog
        isVisible={showDeleteConfirm}
        title="Xóa cuộc trò chuyện"
        message="Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác."
        color="red"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Xóa"
      />

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
            <p className="text-gray-500">Đang tải cuộc trò chuyện...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div>
            {filteredConversations.map((conversation, index) => (
              <div
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`px-4 py-3.5 cursor-pointer transition-all duration-200 group ${
                  activeConversation === conversation.id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "hover:bg-gray-50 border-l-4 border-transparent"
                } ${index !== 0 ? "border-t border-gray-100" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-gray-500 text-xs mb-1.5">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        <span>{formatDate(conversation.date)}</span>
                      </div>
                    </div>
                    <div
                      className={`truncate ${
                        activeConversation === conversation.id
                          ? "text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {conversation.title}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    disabled={deletingId === conversation.id}
                    className="ml-2 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Xóa cuộc trò chuyện"
                  >
                    {deletingId === conversation.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
            <div className="bg-blue-50 p-5 rounded-full mb-4">
              <MessageSquare size={32} className="text-blue-500" />
            </div>
            {searchQuery ? (
              <>
                <p className="font-medium text-gray-800 mb-2">
                  Không tìm thấy kết quả
                </p>
                <p className="text-gray-500 text-sm">
                  Không tìm thấy cuộc trò chuyện nào phù hợp với "{searchQuery}"
                </p>
                <button
                  onClick={clearSearch}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center"
                >
                  <X size={16} className="mr-2" />
                  Xóa tìm kiếm
                </button>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-800 mb-2">
                  Chưa có cuộc trò chuyện nào
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Bắt đầu cuộc trò chuyện mới với chatbot ngay bây giờ
                </p>
                <button
                  onClick={handleNewChat}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center shadow-sm hover:shadow"
                >
                  <PlusCircle size={18} className="mr-2" />
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
