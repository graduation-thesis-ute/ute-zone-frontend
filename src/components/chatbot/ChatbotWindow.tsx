import React, { useState, useRef, useEffect } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import useFetch from "../../hooks/useFetch";
import { remoteUrl } from "../../types/constant";
import WelcomeIcon from "../../assets/welcome.png";

interface ChatbotWindowProps {
  conversation: any;
  userCurrent: any;
  onMessageChange: () => void;
}

const ChatbotWindow: React.FC<ChatbotWindowProps> = ({
  conversation,
  userCurrent,
  onMessageChange,
}) => {
  const { get } = useFetch();
  const [messages, setMessages] = useState<any[]>([
    { type: "bot", content: "Chào buổi sáng ☀️\nMình có thể giúp gì cho bạn?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [suggestionQuestions] = useState([
    { icon: "💡", text: "Tôi muốn biết về học bổng của trường" },
    { icon: "🕒", text: "Có nên học ở HCMUTE không?" },
    { icon: "⚠️", text: "Điểm chuẩn các ngành năm trước là bao nhiêu?" },
    { icon: "✅", text: "Ngành Công nghệ thông tin học những gì?" },
  ]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);

  useEffect(() => {
    if (conversation?.id) {
      loadConversation(conversation.id);
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversation = async (conversationId: string) => {
    try {
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

    if (!conversation?.id) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Lỗi: Không tìm thấy cuộc trò chuyện" },
      ]);
      return;
    }

    const eventSource = new EventSourcePolyfill(
      `${remoteUrl}/v1/chatbot/chat?question=${encodeURIComponent(
        question
      )}&conversationId=${conversation.id}`,
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
        onMessageChange();
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSend(question);
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 bg-gray-100 p-6 rounded-lg shadow-lg">
        <p className="text-lg font-semibold text-gray-800">
          Chào mừng đến với <span className="text-blue-600">Chatbot UTE</span>
        </p>
        <img
          src={WelcomeIcon}
          alt="Welcome icon"
          className="w-1/2 md:w-1/3 lg:w-1/4 rounded-full shadow-md"
        />
        <div className="text-gray-600 text-sm italic text-center">
          Chọn một cuộc trò chuyện hoặc tạo mới để bắt đầu
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-1 overflow-y-auto p-6" ref={chatContainerRef}>
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
                <span className="text-sm text-gray-700">{suggestion.text}</span>
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
              disabled={!inputValue.trim()}
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
  );
};

export default ChatbotWindow;
