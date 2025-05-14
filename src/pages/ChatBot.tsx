import { useState, useRef, useEffect } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import useFetch from "../hooks/useFetch";
import { remoteUrl } from "../types/constant";
import { v4 as uuidv4 } from "uuid";

const Chatbot = () => {
  const { get, post, loading, error } = useFetch();
  type Message = { type: string; content: string; streaming?: boolean };
  type Conversation = { id: string; date: string; title: string };
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", content: "Chào buổi sáng ☀️\nMình có thể giúp gì cho bạn?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [suggestionQuestions] = useState([
    { icon: "💡", text: "Tôi muốn biết về học bổng của trường" },
    { icon: "🕒", text: "Có nên học ở HCMUTE không?" },
    { icon: "⚠️", text: "Điểm chuẩn các ngành năm trước là bao nhiêu?" },
    { icon: "✅", text: "Ngành Công nghệ thông tin học những gì?" },
  ]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);

  // Tải danh sách conversations
  useEffect(() => {
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

        // Tự động tải cuộc trò chuyện đầu tiên nếu có
        if (history.length > 0) {
          setCurrentConversationId(history[0].conversationId);
          loadConversation(history[0].conversationId);
        }
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: `Lỗi: ${
              err?.message || "Không thể tải danh sách cuộc trò chuyện"
            }`,
          },
        ]);
      }
    };

    fetchConversations();
  }, [get]);

  // Cuộn xuống cuối khi messages thay đổi
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Tải lịch sử tin nhắn của conversation
  const loadConversation = async (conversationId: string) => {
    try {
      setCurrentConversationId(conversationId);
      const token = localStorage.getItem("accessToken");
      const conversation = await get(
        `/v1/chatbot/conversation/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const historyMessages = conversation.messages.map((msg: any) => ({
        type: msg.role === "user" ? "user" : "bot",
        content: msg.content,
      }));

      setMessages([
        {
          type: "bot",
          content: "Chào buổi sáng ☀️\nMình có thể giúp gì cho bạn?",
        },
        ...historyMessages,
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: `Lỗi: ${err?.message || "Không thể tải lịch sử trò chuyện"}`,
        },
      ]);
    }
  };

  // Tạo cuộc trò chuyện mới
  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const newConversationId = uuidv4();

      // Gửi yêu cầu tạo conversation mới
      await post("/v1/chatbot/conversation/new", {
        conversationId: newConversationId,
      });

      setCurrentConversationId(newConversationId);
      setMessages([
        {
          type: "bot",
          content: "Chào buổi sáng ☀️\nMình có thể giúp gì cho bạn?",
        },
      ]);

      setConversations((prev) => [
        {
          id: newConversationId,
          date: new Date().toLocaleDateString("vi-VN"),
          title: "Cuộc trò chuyện mới",
        },
        ...prev,
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: `Lỗi: ${
            err?.message || "Không thể tạo cuộc trò chuyện mới"
          }`,
        },
      ]);
    }
  };

  // Xử lý gửi câu hỏi
  const handleSend = (questionText = inputValue) => {
    const question = questionText.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { type: "user", content: question }]);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Vui lòng đăng nhập để sử dụng chatbot." },
      ]);
      setInputValue("");
      return;
    }

    // Nếu không có conversationId, tạo mới
    if (!currentConversationId) {
      handleNewChat();
      return;
    }

    const eventSource = new EventSourcePolyfill(
      `${remoteUrl}/v1/chatbot/chat?question=${encodeURIComponent(
        question
      )}&conversationId=${currentConversationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    eventSourceRef.current = eventSource;

    let streamedResponse = "";

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.token) {
        streamedResponse += data.token;
        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].type === "bot" &&
            newMessages[newMessages.length - 1].streaming
          ) {
            newMessages[newMessages.length - 1].content = streamedResponse;
          } else {
            newMessages.push({
              type: "bot",
              content: streamedResponse,
              streaming: true,
            });
          }
          return newMessages;
        });
      } else if (data.done) {
        setMessages((prev) => {
          const newMessages = [...prev];
          if (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].streaming
          ) {
            newMessages[newMessages.length - 1].streaming = false;
          }
          return newMessages;
        });

        // Cập nhật title của conversation (dựa trên câu hỏi đầu tiên)
        if (messages.length === 1) {
          setConversations((prev) =>
            prev.map((convo) =>
              convo.id === currentConversationId
                ? { ...convo, title: question.slice(0, 20) + "..." }
                : convo
            )
          );
        }

        eventSource.close();
      } else if (data.error) {
        streamedResponse += `\n[ERROR]: ${data.error}`;
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: streamedResponse },
        ]);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "[Lỗi kết nối, vui lòng thử lại]" },
      ]);
      eventSource.close();
    };

    setInputValue("");
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSend(question);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 flex justify-center border-b border-gray-200">
          <img src="/logo.png" alt="HCMUTE Logo" className="h-16" />
        </div>
        <div className="px-4 py-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50"
          >
            <span className="mr-2">+</span>
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-gray-500">Đang tải...</div>
          )}
          {error && (
            <div className="px-4 py-3 text-red-500">Lỗi: {error.message}</div>
          )}
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => loadConversation(convo.id)}
              className={`px-4 py-3 hover:bg-gray-100 cursor-pointer ${
                currentConversationId === convo.id ? "bg-blue-50" : ""
              }`}
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
                <span>{convo.date}</span>
              </div>
              <div className="text-gray-700 truncate pl-6">{convo.title}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center justify-center text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <span>Khám phá</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 bg-gray-50"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-6 ${
                message.type === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 whitespace-pre-wrap ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 shadow border border-gray-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500 mb-3 flex items-center">
              <span className="mr-2">✨</span>
              Các câu hỏi phổ biến
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suggestionQuestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 flex items-start"
                >
                  <span className="mr-2">{suggestion.icon}</span>
                  <span className="text-sm text-gray-700">
                    {suggestion.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="relative flex items-center">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 p-3 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring focus:border-blue-400 resize-none"
              rows={1}
            />
            <div className="absolute right-2">
              <button
                onClick={() => handleSend()}
                disabled={loading || !inputValue.trim()}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right">
            {inputValue.length}/1000
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
