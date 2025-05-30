import { useEffect } from "react";
import { Socket } from "socket.io-client";

interface UseSocketVideoCallProps {
  socket: Socket | null;
  onIncomingVideoCall?: (data: {
    callerId: string;
    callerName: string;
    callerAvatar: string;
    conversationId: string;
  }) => void;
  onVideoCallAccepted?: (data: {
    receiverId: string;
    receiverName: string;
    receiverAvatar: string;
    conversationId: string;
  }) => void;
  onVideoCallRejected?: (data: {
    receiverId: string;
    conversationId: string;
  }) => void;
  onOffer?: (data: any) => void;
  onAnswer?: (data: any) => void;
  onIceCandidate?: (data: any) => void;
  onEndCallWhileCallingByCaller?: () => void;
  onEndCallWhileCallingByReceiver?: () => void;
  onEndCallByCaller?: () => void;
  onEndCallByReceiver?: () => void;
}

export const useSocketVideoCall = ({
  socket,
  onIncomingVideoCall,
  onVideoCallAccepted,
  onVideoCallRejected,
  onOffer,
  onAnswer,
  onIceCandidate,
  onEndCallWhileCallingByCaller,
  onEndCallWhileCallingByReceiver,
  onEndCallByCaller,
  onEndCallByReceiver,
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

    socket.on("connect", () => {
      console.log("Socket connected in useSocketVideoCall");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    // Video call events
    socket.on("INCOMING_VIDEO_CALL", (data) => {
      console.log("FE received INCOMING_VIDEO_CALL:", data);
      if (onIncomingVideoCall) onIncomingVideoCall(data);
    });

    socket.on("VIDEO_CALL_ACCEPTED", (data) => {
      console.log("FE received VIDEO_CALL_ACCEPTED:", data);
      if (onVideoCallAccepted) onVideoCallAccepted(data);
    });

    socket.on("VIDEO_CALL_REJECTED", (data) => {
      console.log("FE received VIDEO_CALL_REJECTED:", data);
      if (onVideoCallRejected) {
        onVideoCallRejected(data);
      }
    });

    // WebRTC signaling events
    socket.on("OFFER", (data) => {
      console.log("FE received OFFER:", data);
      if (onOffer) onOffer(data);
    });

    socket.on("ANSWER", (data) => {
      console.log("FE received ANSWER:", data);
      if (onAnswer) onAnswer(data);
    });

    socket.on("ICE_CANDIDATE", (data) => {
      console.log("FE received ICE_CANDIDATE:", data);
      if (onIceCandidate) onIceCandidate(data);
    });

    socket.on("END_CALL_WHILE_CALLING_BY_CALLER", () => {
      console.log("FE received END_CALL_WHILE_CALLING_BY_CALLER");
      if (onEndCallWhileCallingByCaller) onEndCallWhileCallingByCaller();
    });

    socket.on("END_CALL_WHILE_CALLING_BY_RECEIVER", () => {
      console.log("FE received END_CALL_WHILE_CALLING_BY_RECEIVER");
      if (onEndCallWhileCallingByReceiver) onEndCallWhileCallingByReceiver();
    });

    socket.on("END_VIDEO_CALL_BY_CALLER", () => {
      console.log("FE received END_VIDEO_CALL_BY_CALLER:");
      if (onEndCallByCaller) onEndCallByCaller();
    });

    socket.on("END_VIDEO_CALL_BY_RECEIVER", () => {
      console.log("FE received END_VIDEO_CALL_BY_RECEIVER:");
      if (onEndCallByReceiver) onEndCallByReceiver();
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
      socket.off("END_CALL_WHILE_CALLING_BY_CALLER");
      socket.off("END_CALL_WHILE_CALLING_BY_RECEIVER");
      socket.off("END_VIDEO_CALL_BY_CALLER");
      socket.off("END_VIDEO_CALL_BY_RECEIVER");
    };
  }, [
    socket,
    onIncomingVideoCall,
    onVideoCallAccepted,
    onVideoCallRejected,
    onOffer,
    onAnswer,
    onIceCandidate,
  ]);

  return socket;
};

export default useSocketVideoCall;
