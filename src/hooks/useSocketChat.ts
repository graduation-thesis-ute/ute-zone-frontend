import { useEffect, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";

interface UseSocketChatProps {
  conversationId?: string;
  userId?: string;
  remoteUrl: string;
  onNewMessage: (messageId: string) => void;
  onUpdateMessage: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onConversationUpdate?: () => void;
  onHandleUpdateConversation: (conversationId: string) => void;
}

export const useSocketChat = ({
  conversationId,
  userId,
  remoteUrl,
  onNewMessage,
  onUpdateMessage,
  onDeleteMessage,
  onConversationUpdate,
  onHandleUpdateConversation,
}: UseSocketChatProps) => {
  const socketRef = useRef<Socket | null>(null);

  const initializeSocket = useCallback(() => {
    const socket = io(remoteUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on("connect", () => {
      console.log("Socket.IO Chat Connected with ID:", socket.id);
      if (conversationId) socket.emit("JOIN_CONVERSATION", conversationId);
      if (userId) {
        socket.emit("JOIN_USER", userId);
        socket.emit("JOIN_NOTIFICATION", userId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO Chat Disconnected:", reason);
    });

    socket.on("CREATE_MESSAGE", (messageId: string) => {
      onNewMessage(messageId);
      if (onConversationUpdate) onConversationUpdate();
    });

    socket.on("UPDATE_MESSAGE", (messageId: string) => {
      onUpdateMessage(messageId);
      if (onConversationUpdate) onConversationUpdate();
    });

    socket.on("DELETE_MESSAGE", (messageId: string) => {
      onDeleteMessage(messageId);
      if (onConversationUpdate) onConversationUpdate();
    });

    socket.on("NEW_NOTIFICATION", () => {
      if (onConversationUpdate) onConversationUpdate();
    });

    socket.on("UPDATE_CONVERSATION", (conversationId: string) => {
      onHandleUpdateConversation(conversationId);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        if (conversationId) socket.emit("LEAVE_CONVERSATION", conversationId);
        if (userId) {
          socket.emit("LEAVE_USER", userId);
          socket.emit("LEAVE_NOTIFICATION", userId);
        }
        socket.disconnect();
      }
    };
  }, [
    conversationId,
    userId,
    remoteUrl,
    onNewMessage,
    onUpdateMessage,
    onDeleteMessage,
    onConversationUpdate,
    onHandleUpdateConversation,
  ]);

  useEffect(() => {
    const cleanup = initializeSocket();
    return cleanup;
  }, [initializeSocket]);

  return socketRef.current; // Trả về socket instance
};

export default useSocketChat;
