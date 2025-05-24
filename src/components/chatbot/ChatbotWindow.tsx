import React, { useState, useRef, useEffect } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import useFetch from "../../hooks/useFetch";
import { remoteUrl } from "../../types/constant";
import WelcomeIcon from "../../assets/welcome.png";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";

interface ChatbotWindowProps {
  conversation: any;
  userCurrent: any;
  onMessageChange: () => void;
}

const ChatbotWindow: React.FC<ChatbotWindowProps> = ({
  conversation,
  onMessageChange,
}) => {
  const { get } = useFetch();
  const [messages, setMessages] = useState<any[]>([
    {
      type: "bot",
      content: "Chào buổi sáng ☀️\nMình có thể giúp gì cho bạn?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isReceivingResponse, setIsReceivingResponse] = useState(false);
  const [suggestionQuestions, setSuggestionQuestions] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await get("/v1/chatbot/suggestions/active");
        setSuggestionQuestions(res);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    };
    fetchSuggestions();
  }, []);

  const loadConversation = async (conversationId: string) => {
    try {
      // setIsTyping(true);
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
        timestamp: msg.createdAt || new Date().toISOString(),
      }));

      if (historyMessages.length > 0) {
        setMessages([...historyMessages]);
      } else {
        setMessages([
          {
            type: "bot",
            content: "Chào buổi sáng ☀️\nMình có thể giúp gì cho bạn?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: `Lỗi: ${err?.message || "Không thể tải lịch sử trò chuyện"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (questionText = inputValue) => {
    const question = questionText.trim();
    if (!question) return;

    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { type: "user", content: question, timestamp: now },
    ]);
    setIsTyping(true);
    setIsReceivingResponse(false);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "Vui lòng đăng nhập để sử dụng chatbot.",
          timestamp: new Date().toISOString(),
        },
      ]);
      setInputValue("");
      setIsTyping(false);
      return;
    }

    if (!conversation?.id) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "Lỗi: Không tìm thấy cuộc trò chuyện",
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
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
    const responseTimestamp = new Date().toISOString();

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.token) {
        // Khi bắt đầu nhận được token đầu tiên, tắt hiệu ứng typing
        if (!isReceivingResponse) {
          setIsReceivingResponse(true);
          setIsTyping(false);
        }

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
              timestamp: responseTimestamp,
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
        setIsTyping(false);
        setIsReceivingResponse(false);
      } else if (data.error) {
        streamedResponse += `\n[ERROR]: ${data.error}`;
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: streamedResponse,
            timestamp: responseTimestamp,
          },
        ]);
        eventSource.close();
        setIsTyping(false);
        setIsReceivingResponse(false);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "[Lỗi kết nối, vui lòng thử lại]",
          timestamp: new Date().toISOString(),
        },
      ]);
      eventSource.close();
      setIsTyping(false);
      setIsReceivingResponse(false);
    };

    setInputValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-blue-50 to-white p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="mb-6 bg-blue-100 p-4 rounded-full inline-flex items-center justify-center">
            <Bot size={36} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Chào mừng đến với <span className="text-blue-600">Chatbot UTE</span>
          </h2>
          <img
            src={WelcomeIcon}
            alt="Welcome icon"
            className="w-40 h-40 mx-auto my-6 rounded-full shadow-md object-cover"
          />
          <p className="text-gray-600 mb-6">
            Chatbot UTE sẽ hỗ trợ bạn trong việc tìm kiếm thông tin về trường và
            các khóa học.
          </p>
          <div className="text-gray-500 text-sm italic">
            Chọn một cuộc trò chuyện hoặc tạo mới để bắt đầu
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 flex items-center">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <Bot size={22} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-800">{conversation.title}</h3>
          {/* <p className="text-xs text-gray-500">
            {formatTime(messages[0]?.timestamp || "")}
          </p> */}
        </div>
      </div>

      {/* Chat Container */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth"
        ref={chatContainerRef}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`group flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Avatar for bot */}
            {message.type === "bot" && (
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}

            <div className="flex flex-col max-w-[75%]">
              <div
                className={`rounded-2xl p-4 whitespace-pre-wrap ${
                  message.type === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white text-gray-800 shadow-sm border border-gray-200 rounded-tl-none"
                }`}
              >
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatTime(message.timestamp)}
              </div>
            </div>

            {/* Avatar for user */}
            {message.type === "user" && (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator - Chỉ hiển thị khi đang chờ phản hồi và chưa nhận được token nào */}
        {isTyping && !isReceivingResponse && (
          <div className="flex justify-start">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 rounded-tl-none">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && suggestionQuestions.length > 0 && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="flex items-center mb-3">
            <Sparkles size={16} className="text-blue-500 mr-2" />
            <p className="text-sm font-medium text-gray-700">
              Các câu hỏi phổ biến
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestionQuestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200 flex items-start shadow-sm"
              >
                <span className="mr-2 text-lg">{suggestion.icon}</span>
                <span className="text-sm text-gray-700">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-start shadow-sm rounded-2xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 p-3 pr-16 max-h-32 focus:outline-none resize-none w-full"
            style={{ minHeight: "48px", height: "48px" }}
            rows={1}
          />
          <div className="absolute right-2 bottom-2">
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping || isReceivingResponse}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors duration-200"
            >
              {isTyping || isReceivingResponse ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <div className="text-xs text-gray-500">
            Shift + Enter để xuống dòng
          </div>
          <div
            className={`text-xs ${
              inputValue.length > 800
                ? "text-amber-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {inputValue.length}/1000
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWindow;
