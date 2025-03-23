import React, { useRef, useEffect } from "react";
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
  onToggleDropdown: (messageId: string) => void;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [isScrollToBottom]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleScroll = () => {
        if (scrollContainer.scrollTop === 0) {
          onScroll();
        }
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
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {isLoadingMessages && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      {messages.map((message) => (
        <MessageItem
          key={message._id}
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
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
