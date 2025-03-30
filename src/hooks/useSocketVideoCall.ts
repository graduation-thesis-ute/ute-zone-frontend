import { useEffect } from "react";
import { Socket } from "socket.io-client";

interface UseSocketVideoCallProps {
  socket: Socket | null; // Nhận socket từ ngoài thay vì tạo mới
  onIncomingVideoCall?: (data: {
    callerId: string;
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
    if (!socket) return;

    socket.on(
      "INCOMING_VIDEO_CALL",
      (data: { callerId: string; conversationId: string }) => {
        console.log("FE received INCOMING_VIDEO_CALL:", data);
        if (onIncomingVideoCall) onIncomingVideoCall(data);
      }
    );

    socket.on(
      "VIDEO_CALL_ACCEPTED",
      (data: { receiverId: string; conversationId: string }) => {
        console.log("FE received VIDEO_CALL_ACCEPTED:", data);
        if (onVideoCallAccepted) onVideoCallAccepted(data);
      }
    );

    socket.on(
      "VIDEO_CALL_REJECTED",
      (data: { receiverId: string; conversationId: string }) => {
        console.log("FE received VIDEO_CALL_REJECTED:", data);
        if (onVideoCallRejected) onVideoCallRejected(data);
      }
    );

    socket.on("OFFER", (data: any) => {
      console.log("FE received OFFER:", data);
      if (onOffer) onOffer(data);
    });

    socket.on("ANSWER", (data: any) => {
      console.log("FE received ANSWER:", data);
      if (onAnswer) onAnswer(data);
    });

    socket.on("ICE_CANDIDATE", (data: any) => {
      console.log("FE received ICE_CANDIDATE:", data);
      if (onIceCandidate) onIceCandidate(data);
    });

    socket.on(
      "VIDEO_CALL_ENDED",
      (data: { callerId?: string; receiverId?: string }) => {
        console.log("FE received VIDEO_CALL_ENDED:", data);
        if (onVideoCallEnded) onVideoCallEnded(data);
      }
    );

    socket.on(
      "CALL_ENDED",
      (data: { message: string; senderId: string; receiverId: string }) => {
        console.log("FE received CALL_ENDED:", data);
        if (onCallEnded) onCallEnded(data);
      }
    );

    return () => {
      // Không cần disconnect ở đây vì socket được quản lý bởi useSocketChat
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
