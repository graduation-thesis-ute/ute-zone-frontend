import { useEffect } from "react";
import { Socket } from "socket.io-client";

interface UseSocketVideoCallProps {
  socket: Socket | null; // Nhận socket từ ngoài thay vì tạo mới
  onIncomingVideoCall?: (data: {
    callerId: string;
    callerName: string;
    callerAvatar: string;
    conversationId: string;
  }) => void;
  onVideoCallAccepted?: (data: {
    receiverId: string;
    conversationId: string;
  }) => void;
  onVideoCallRejected?: (data: {
    receiverId: string;
    conversationId: string;
  }) => void;
  onOffer?: (data: any) => void;
  onAnswer?: (data: any) => void;
  onIceCandidate?: (data: any) => void;
  onVideoCallEnded?: (data: { callerId?: string; receiverId?: string }) => void;
  onCallEnded?: (data: {
    message: string;
    senderId: string;
    receiverId: string;
  }) => void;
}

export const useSocketVideoCall = ({
  socket,
  onIncomingVideoCall,
  onVideoCallAccepted,
  onVideoCallRejected,
  onOffer,
  onAnswer,
  onIceCandidate,
  onVideoCallEnded,
  onCallEnded,
}: UseSocketVideoCallProps) => {
  useEffect(() => {
    if (!socket) {
      console.warn("Socket is null in useSocketVideoCall");
      return;
    }

    console.log(
      "Socket connection status:",
      socket.connected ? "connected" : "disconnected"
    );

    // Handle socket connection events
    socket.on("connect", () => {
      console.log("Socket connected in useSocketVideoCall");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    // Handle incoming video call
    socket.on("INCOMING_VIDEO_CALL", (data) => {
      console.log("FE received INCOMING_VIDEO_CALL:", data);
      if (onIncomingVideoCall) onIncomingVideoCall(data);
    });

    // Handle video call accepted
    socket.on("VIDEO_CALL_ACCEPTED", (data) => {
      console.log("FE received VIDEO_CALL_ACCEPTED:", data);
      if (onVideoCallAccepted) onVideoCallAccepted(data);
    });

    // Handle video call rejected
    socket.on("VIDEO_CALL_REJECTED", (data) => {
      console.log("FE received VIDEO_CALL_REJECTED:", data);
      if (onVideoCallRejected) {
        // Clear all call-related state
        onVideoCallRejected(data);
      }
    });

    // Handle video call ended
    socket.on("VIDEO_CALL_ENDED", (data) => {
      console.log("FE received VIDEO_CALL_ENDED:", data);
      if (onVideoCallEnded) onVideoCallEnded(data);
    });

    // Handle offer
    socket.on("OFFER", (data) => {
      console.log("FE received OFFER:", data);
      if (onOffer) onOffer(data);
    });

    // Handle answer
    socket.on("ANSWER", (data) => {
      console.log("FE received ANSWER:", data);
      if (onAnswer) onAnswer(data);
    });

    // Handle ICE candidate
    socket.on("ICE_CANDIDATE", (data) => {
      console.log("FE received ICE_CANDIDATE:", data);
      if (onIceCandidate) onIceCandidate(data);
    });

    // Handle call ended message
    socket.on("CALL_ENDED", (data) => {
      console.log("FE received CALL_ENDED:", data);
      if (onCallEnded) onCallEnded(data);
    });

    // Clean up event listeners
    return () => {
      console.log("Cleaning up socket event listeners");
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("INCOMING_VIDEO_CALL");
      socket.off("VIDEO_CALL_ACCEPTED");
      socket.off("VIDEO_CALL_REJECTED");
      socket.off("VIDEO_CALL_ENDED");
      socket.off("OFFER");
      socket.off("ANSWER");
      socket.off("ICE_CANDIDATE");
      socket.off("CALL_ENDED");
    };
  }, [
    socket,
    onIncomingVideoCall,
    onVideoCallAccepted,
    onVideoCallRejected,
    onOffer,
    onAnswer,
    onIceCandidate,
    onVideoCallEnded,
    onCallEnded,
  ]);

  return socket; // Trả về socket để sử dụng nếu cần
};

export default useSocketVideoCall;
