import React, { useEffect, useRef } from "react";
import {
  MoreVertical,
  Edit,
  Trash,
  X,
  Check,
  Heart,
  Clock,
} from "lucide-react";
import UserIcon from "../../assets/user_icon.png";
import { Message } from "../../models/profile/chat";
import { decrypt } from "../../types/utils";

interface MessageItemProps {
  message: Message;
  userCurrent: any;
  isEditing: boolean;
  editedMessage: string;
  editedImageUrl: string;
  onEditMessage: (messageId: string, content: string, imageUrl: string) => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
  onReaction: (messageId: string) => void;
  onToggleDropdown: (messageId: string | null) => void;
  activeDropdown: string | null;
  onAvatarClick: (user: any) => void;
  onUpdateMessage: (
    messageId: string,
    content: string,
    imageUrl: string
  ) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  userCurrent,
  isEditing,
  editedMessage,
  editedImageUrl,
  onEditMessage,
  onCancelEdit,
  onDeleteMessage,
  onReaction,
  onToggleDropdown,
  activeDropdown,
  onAvatarClick,
  onUpdateMessage,
}) => {
  const isOwnMessage = message.user._id === userCurrent?._id;

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggleDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onToggleDropdown]);

  const handleEditSubmit = () => {
    onUpdateMessage(message._id, editedMessage, editedImageUrl);
  };

  return (
    <div
      id={message._id}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group`}
    >
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-3 mt-1">
          <img
            src={message.user.avatarUrl || UserIcon}
            alt={message.user.displayName}
            className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => onAvatarClick(message.user)}
          />
        </div>
      )}

      <div className="relative max-w-sm">
        <div
          className={`px-4 py-3 rounded-2xl ${
            isOwnMessage
              ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-tr-none shadow-md"
              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-md"
          } transition-all duration-200`}
        >
          {!isOwnMessage && (
            <div className="flex items-center space-x-1 mb-1">
              <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                {message.user.displayName}
              </p>
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col items-start gap-2">
              <div className="flex w-full gap-2">
                <input
                  type="text"
                  value={editedMessage}
                  onChange={(e) =>
                    onEditMessage(message._id, e.target.value, editedImageUrl)
                  }
                  className="flex-grow text-gray-800 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none text-sm"
                  autoFocus
                />
                <button
                  onClick={onCancelEdit}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="p-2 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  title="Save"
                >
                  <Check size={18} />
                </button>
              </div>

              {editedImageUrl && (
                <div className="w-full mt-2">
                  <div className="relative group/img">
                    <img
                      src={editedImageUrl}
                      alt="Message attachment"
                      className="max-w-full h-auto max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(editedImageUrl, "_blank")}
                    />
                    <button
                      onClick={() =>
                        onEditMessage(message._id, editedMessage, "")
                      }
                      className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-60 rounded-full hidden group-hover/img:block"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {message.content && (
                <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                  {decrypt(message.content, userCurrent?.secretKey)}
                </p>
              )}

              {message.imageUrl && (
                <div className={`${message.content ? "mt-3" : "mt-0"}`}>
                  <img
                    src={message.imageUrl}
                    alt="Message attachment"
                    className="max-w-full h-auto max-h-72 rounded-lg cursor-zoom-in hover:opacity-95 transition-all shadow-sm"
                    onClick={() => window.open(message.imageUrl, "_blank")}
                  />
                </div>
              )}

              {!message.content && !message.imageUrl && (
                <div className="flex items-center text-gray-500 dark:text-gray-400 italic text-sm">
                  <Clock size={14} className="mr-1 opacity-70" />
                  <p>Không thể hiển thị tin nhắn</p>
                </div>
              )}
            </>
          )}

          <div
            className={`flex justify-between items-center mt-2 ${
              isOwnMessage ? "text-blue-100" : "text-gray-400"
            }`}
          >
            <p className="text-xs opacity-80">{message.createdAt}</p>

            {message.isUpdated === 1 && (
              <span className="text-xs ml-2 opacity-70">(đã chỉnh sửa)</span>
            )}
          </div>
        </div>

        <div
          className={`absolute ${
            isOwnMessage ? "-left-8" : "-right-8"
          } bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
        >
          <button
            onClick={() => onReaction(message._id)}
            className={`flex items-center justify-center rounded-full p-2 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
              message.isReacted === 1
                ? "bg-red-50 dark:bg-red-900/20"
                : "bg-gray-50 dark:bg-gray-800"
            } shadow-sm hover:shadow`}
            title="React"
          >
            <Heart
              size={16}
              className={
                message.isReacted === 1
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400 dark:text-gray-500"
              }
            />
          </button>
        </div>

        {message.totalReactions > 0 && (
          <div
            className={`absolute ${
              isOwnMessage ? "-left-12" : "-right-12"
            } -bottom-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 flex items-center shadow-sm`}
          >
            <Heart size={12} className="text-red-500 fill-red-500 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {message.totalReactions}
            </span>
          </div>
        )}

        {isOwnMessage && (
          <div className="absolute -top-1 -right-1">
            <button
              onClick={() => onToggleDropdown(message._id)}
              className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreVertical
                size={14}
                className="text-gray-500 dark:text-gray-300"
              />
            </button>
            {activeDropdown === message._id && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => {
                    onEditMessage(
                      message._id,
                      decrypt(message.content, userCurrent.secretKey),
                      message.imageUrl
                    );
                    onToggleDropdown(null);
                  }}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit size={14} className="mr-2" /> Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    onDeleteMessage(message._id);
                    onToggleDropdown(null);
                  }}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash size={14} className="mr-2" /> Xoá
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
