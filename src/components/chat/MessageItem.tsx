import React from "react";
import {
  MoreVertical,
  Edit,
  Trash,
  X,
  Check,
  Heart,
  ImageIcon,
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
  onToggleDropdown: (messageId: string) => void;
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

  const handleEditSubmit = () => {
    onUpdateMessage(message._id, editedMessage, editedImageUrl);
  };

  return (
    <div
      id={message._id}
      className={`mb-4 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-3">
          <img
            src={message.user.avatarUrl || UserIcon}
            alt={message.user.displayName}
            className="w-8 h-8 rounded-full border-4 border-blue-100 shadow-lg"
            onClick={() => onAvatarClick(message.user)}
          />
        </div>
      )}

      <div className="relative">
        <div
          className={`p-3 rounded-lg max-w-xs break-all ${
            isOwnMessage
              ? "bg-blue-500 text-white"
              : "bg-white text-black shadow"
          } relative`}
        >
          {!isOwnMessage && (
            <p className="font-semibold text-sm">{message.user.displayName}</p>
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
                  className="flex-grow text-black p-2 border rounded-md"
                />
                <button
                  onClick={onCancelEdit}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-2 py-1 bg-green-500 text-white rounded-md"
                >
                  <Check size={16} />
                </button>
              </div>

              {editedImageUrl && (
                <div className="w-full mt-2">
                  <img
                    src={editedImageUrl}
                    alt="Message attachment"
                    className="max-w-full max-h-40 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(editedImageUrl, "_blank")}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {message.content && (
                <p className="mt-1">
                  {decrypt(message.content, userCurrent?.secretKey)}
                </p>
              )}

              {message.imageUrl && (
                <div className={`${message.content ? "mt-2" : "mt-0"}`}>
                  <img
                    src={message.imageUrl}
                    alt="Message attachment"
                    className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.imageUrl, "_blank")}
                  />
                </div>
              )}

              {!message.content && !message.imageUrl && (
                <p className="mt-1">Không thể hiển thị tin nhắn</p>
              )}
            </>
          )}

          <p className="text-xs mt-1 opacity-70">{message.createdAt}</p>

          <div className="absolute -bottom-2 -right-2">
            <button
              onClick={() => onReaction(message._id)}
              className="flex items-center space-x-1 bg-gray-50 shadow-md rounded-full p-2 hover:bg-gray-300 transition-colors"
            >
              <Heart
                size={14}
                className={
                  message.isReacted === 1 ? "text-red-500" : "text-gray-500"
                }
              />
              {message.totalReactions > 0 && (
                <span className="text-xs text-gray-500">
                  {message.totalReactions}
                </span>
              )}
            </button>
          </div>
        </div>

        {isOwnMessage && (
          <div className="absolute top-0 right-0 -mt-1 -mr-1">
            <button
              onClick={() => onToggleDropdown(message._id)}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {activeDropdown === message._id && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    onEditMessage(
                      message._id,
                      decrypt(message.content, userCurrent.secretKey),
                      message.imageUrl
                    );
                    onToggleDropdown(message._id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit size={16} className="mr-2" /> Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    onDeleteMessage(message._id);
                    onToggleDropdown(message._id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash size={16} className="mr-2" /> Xoá
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
