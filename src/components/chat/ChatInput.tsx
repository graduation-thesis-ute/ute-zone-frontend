import React, { useRef } from "react";
import { ImageIcon, XIcon } from "lucide-react";

interface ChatInputProps {
  newMessage: string;
  selectedImage: File | null;
  isSendingMessage: boolean;
  isCanMessage: number;
  isOwner: number;
  conversationKind: number;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSelectedImage: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  selectedImage,
  isSendingMessage,
  isCanMessage,
  isOwner,
  conversationKind,
  onMessageChange,
  onImageSelected,
  onRemoveSelectedImage,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isCanMessage !== 1 && isOwner !== 1 && conversationKind !== 2) {
    return (
      <div className="p-4 bg-gray-100 border-t text-gray-600 text-center">
        Bạn không có quyền gửi tin nhắn trong nhóm này.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="p-4 bg-white border-t">
      <div className="relative">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Preview"
              className="max-h-32 rounded-lg"
            />
            <button
              type="button"
              onClick={onRemoveSelectedImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
            >
              <XIcon size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={onMessageChange}
            placeholder="Nhập tin nhắn tại đây..."
            className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImageSelected}
            accept="image/*"
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer border-y border-r"
          >
            <ImageIcon size={20} />
          </label>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
            disabled={isSendingMessage}
          >
            {isSendingMessage ? "Sending..." : "Gửi"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
