import React, { useRef, useState } from "react";
import { ImageIcon, X, Send, AlertCircle, Paperclip } from "lucide-react";

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
  const [isFocused, setIsFocused] = useState(false);

  if (isCanMessage !== 1 && isOwner !== 1 && conversationKind !== 2) {
    return (
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
        <AlertCircle size={16} className="text-amber-500" />
        <p className="text-sm">
          Bạn không có quyền gửi tin nhắn trong nhóm này.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="relative">
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Preview"
                className="max-h-40 rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
              <button
                type="button"
                onClick={onRemoveSelectedImage}
                className="absolute top-2 right-2 p-1.5 bg-gray-900 bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all duration-200 shadow-md"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
              {selectedImage.name} ({(selectedImage.size / 1024).toFixed(1)} KB)
            </div>
          </div>
        )}

        <div
          className={`flex items-center rounded-2xl border ${
            isFocused
              ? "border-indigo-400 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800"
              : "border-gray-200 dark:border-gray-700"
          } bg-white dark:bg-gray-800 transition-all duration-200`}
        >
          <input
            type="text"
            value={newMessage}
            onChange={onMessageChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Nhập tin nhắn tại đây..."
            className="flex-grow px-4 py-3 bg-transparent rounded-l-2xl focus:outline-none text-gray-800 dark:text-gray-200"
          />

          <div className="flex items-center">
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
              className="p-3 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full cursor-pointer transition-colors"
              title="Attach image"
            >
              <ImageIcon size={20} />
            </label>

            <button
              type="submit"
              disabled={
                isSendingMessage || (!newMessage.trim() && !selectedImage)
              }
              className={`flex items-center justify-center gap-1 ml-1 px-5 py-3 rounded-r-2xl transition-all duration-200 ${
                (!newMessage.trim() && !selectedImage) || isSendingMessage
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
              }`}
            >
              {isSendingMessage ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></div>
                  <span className="text-sm font-medium">Gửi</span>
                </>
              ) : (
                <>
                  <Send size={16} className="mr-1" />
                  <span className="text-sm font-medium">Gửi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional typing indicator that could be added */}
        {/* <div className="absolute -top-6 left-4 text-xs text-gray-500 dark:text-gray-400">
          Someone is typing...
        </div> */}
      </div>

      {/* Optional emoji picker button that could be added */}
      {/* <div className="text-right mt-2">
        <button 
          type="button"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <SmileIcon size={18} />
        </button>
      </div> */}
    </form>
  );
};

export default ChatInput;
