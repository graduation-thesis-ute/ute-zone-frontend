import React, { useRef, useEffect, useState } from "react";
import { Message } from "../../models/profile/chat";
import MessageItem from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  userCurrent: any;
  editingMessageId: string | null;
  editedMessage: string;
  editedImageUrl: string;
  activeDropdown: string | null;
  isLoadingMessages: boolean;
  onEditMessage: (messageId: string, content: string, imageUrl: string) => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
  onReaction: (messageId: string) => void;
  onToggleDropdown: (messageId: string | null) => void;
  onAvatarClick: (user: any) => void;
  onScroll: () => void;
  isScrollToBottom: boolean;
  onUpdateMessage: (
    messageId: string,
    content: string,
    imageUrl: string
  ) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  userCurrent,
  editingMessageId,
  editedMessage,
  editedImageUrl,
  activeDropdown,
  isLoadingMessages,
  onEditMessage,
  onCancelEdit,
  onDeleteMessage,
  onReaction,
  onToggleDropdown,
  onAvatarClick,
  onScroll,
  isScrollToBottom,
  onUpdateMessage,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Ẩn nút sau khi scroll xuống
    setShowScrollButton(false);
  };

  useEffect(() => {
    if (isScrollToBottom) {
      scrollToBottom();
    }
  }, [isScrollToBottom, messages]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleScroll = () => {
        // Kiểm tra có đang ở trên cùng không
        if (scrollContainer.scrollTop === 0) {
          onScroll();
        }

        // Hiển thị nút scroll khi người dùng scroll lên
        const isNearBottom =
          scrollContainer.scrollHeight -
            scrollContainer.scrollTop -
            scrollContainer.clientHeight <
          100;
        setShowScrollButton(!isNearBottom);
      };

      scrollContainer.addEventListener("scroll", handleScroll);
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [onScroll]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-300/90 dark:from-gray-900/95 dark:to-gray-800/90 px-4 py-2 md:px-6"
    >
      {isLoadingMessages && (
        <div className="flex justify-center items-center py-6">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-indigo-500">
              Loading
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 && !isLoadingMessages && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-0.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-center font-medium">No messages yet</p>
          <p className="text-sm text-center mt-1">Start a conversation!</p>
        </div>
      )}

      <div className="space-y-3 py-2">
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`transition-all duration-200 ${
              index === messages.length - 1 && isScrollToBottom
                ? "animate-pulse-once"
                : ""
            }`}
          >
            <MessageItem
              message={message}
              userCurrent={userCurrent}
              isEditing={editingMessageId === message._id}
              editedMessage={editedMessage}
              editedImageUrl={editedImageUrl}
              onEditMessage={onEditMessage}
              onCancelEdit={onCancelEdit}
              onDeleteMessage={onDeleteMessage}
              onReaction={onReaction}
              onToggleDropdown={onToggleDropdown}
              activeDropdown={activeDropdown}
              onAvatarClick={onAvatarClick}
              onUpdateMessage={onUpdateMessage}
            />
          </div>
        ))}
      </div>

      <div ref={messagesEndRef} className="h-1" />

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MessageList;
