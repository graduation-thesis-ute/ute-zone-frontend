import React, { useState, useEffect, useRef, useCallback } from "react";
import useFetch from "../hooks/useFetch";
import useSocketChat from "../hooks/useSocketChat";
import useSocketVideoCall from "../hooks/useSocketVideoCall";
import {
  Message,
  Friends,
  ChatWindowProps,
  ConversationMembers,
} from "../models/profile/chat";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertErrorDialog,
  ConfimationDialog,
  LoadingDialog,
} from "../components/Dialog";
import { encrypt, decrypt, uploadImage } from "../types/utils";
import { remoteUrl } from "../types/constant";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../types/UserContext";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import AddMemberModal from "../components/chat/AddMemberModal";
import ManageMembersModal from "../components/chat/ManageMembersModal";
import MemberListModal from "../components/chat/MemberListModal";
import EditProfilePopup from "../components/chat/EditProfilePopup";
import UserInfoPopup from "../components/chat/UserInfoPopup";
import { Video } from "lucide-react";
import CallingPopup from "../components/chat/CallingPopup";
import IncomingCallPopup from "../components/chat/IncomingCallPopup";
import VideoCallModal from "../components/chat/VideoCallModal";

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  userCurrent,
  onMessageChange,
  onConversationUpdateInfo,
  handleLeaveGroupUpdate,
  handleConversationDeleted,
  onFowardMessage,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingUpdate, setLoadingUpdate] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [friends, setFriends] = useState<Friends[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { get, post, del, put, loading } = useFetch();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const scrollContainerRef = useRef<null | HTMLDivElement>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAlertErrorDialogOpen, setIsAlertErrorDialogOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(0);
  const [isCanUpdate, setIsCanUpdate] = useState<number>();
  const [isCanMessage, setIsCanMessage] = useState<number>();
  const [isCanAddMember, setIsCanAddMember] = useState<number>();
  const [conversationMembersIdList, setConversationMembersIdList] = useState<
    string[]
  >([]);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] =
    useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const size = 20;
  const [isScrollToBottom, setIsScrollToBottom] = useState(false);
  const [updatedGroupName] = useState(conversation.name);
  const [avatar, setAvatar] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isConfirmLeaveDialogOpen, setIsConfirmLeaveDialogOpen] =
    useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [membersList, setMembersList] = useState<ConversationMembers[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isConfirmDelMemDialogOpen, setIsConfirmDelMemDialogOpen] =
    useState(false);
  const [memberIdSelected, setMemberIdSelected] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { profile } = useProfile();

  // State cho video call
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callerAvatar: string;
    conversationId: string;
  } | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // Lưu stream để quản lý mic/camera
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const handleAvatarClick = (user: any) => {
    setSelectedUser(user);
  };

  const closePopup = () => {
    setSelectedUser(null);
  };

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.onloadedmetadata = () => {
        console.log("Remote video metadata loaded");
      };
      remoteVideoRef.current.onplay = () => {
        console.log("Remote video started playing");
      };
      remoteVideoRef.current.onerror = (error) => {
        console.error("Remote video error:", error);
      };
    }
  }, [remoteVideoRef]);

  useEffect(() => {
    const fetchMembersList = async () => {
      setLoadingMembers(true);
      try {
        const response = await get(`/v1/conversation-member/list`, {
          conversation: conversation._id,
        });
        if (response?.data?.content) {
          setMembersList(response.data.content);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembersList();
  }, [conversation._id, get]);

  const handleOpenMemberList = async () => {
    setLoadingMembers(true);
    setIsMemberListOpen(true);
    try {
      const response = await get(`/v1/conversation-member/list`, {
        conversation: conversation._id,
      });
      if (response.result) {
        setMembersList(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string | null) => {
    setLoadingUpdate(true);
    try {
      const response = await del(`/v1/conversation-member/remove/${memberId}`);
      if (response.result) {
        setMembersList((prev) =>
          prev.filter((member) => member._id !== memberId)
        );
        onConversationUpdateInfo(conversation);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Error removing member.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleDisbandGroup = async () => {
    setLoadingUpdate(true);
    try {
      await deleteConversation(conversation._id);
      handleConversationDeleted();
      setIsManageMembersModalOpen(false);
      onConversationUpdateInfo(conversation);
    } catch (error) {
      console.error("Error disbanding group:", error);
      alert("Error disbanding group.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleLeaveGroup = async (memberId: string | null) => {
    setLoadingUpdate(true);
    try {
      await del(`/v1/conversation-member/remove/${memberId}`);
      handleConversationDeleted();
      setIsManageMembersModalOpen(false);
      handleLeaveGroupUpdate(conversation);
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const deleteConversation = async (conversationId: any) => {
    try {
      const response = await del(`/v1/conversation/delete/${conversationId}`);
      if (response.result) {
        console.log("Conversation deleted:", response);
      }
    } catch (error) {
      setErrorMessage("Error deleting conversation.");
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (userId: string) => {
    setSelectedMembers((prevMembers) =>
      prevMembers.includes(userId)
        ? prevMembers.filter((id) => id !== userId)
        : [...prevMembers, userId]
    );
  };

  const fetchMessages = useCallback(
    async (pageNumber: number) => {
      if (!conversation._id) return;
      setIsLoadingMessages(true);
      try {
        setIsCanUpdate(Number(conversation.canUpdate));
        setIsCanMessage(Number(conversation.canMessage));
        setIsCanAddMember(Number(conversation.canAddMember));

        const response = await get("/v1/message/list", {
          page: pageNumber,
          size,
          conversation: conversation._id,
        });

        const newMessages = response.data.content;
        if (pageNumber === 0) {
          setMessages(newMessages.reverse());
          setIsScrollToBottom(true);
        } else {
          const newMessagesReverse = newMessages.reverse();
          setMessages((prev) => [...newMessagesReverse, ...prev]);
        }
        setHasMore(newMessages.length === size);
        setPage(pageNumber);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [conversation._id, get]
  );

  const handleNewMessage = useCallback(
    async (messageId: string) => {
      try {
        const res = await get(`/v1/message/get/${messageId}`);
        const newMessage = res.data;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setIsScrollToBottom(true);
        onMessageChange();
      } catch (error) {
        console.error("Error fetching new message:", error);
      }
    },
    [get, onMessageChange]
  );

  const handleUpdateMessageSocket = useCallback(
    async (messageId: string) => {
      try {
        const resMessage = await get(`/v1/message/get/${messageId}`);
        const updatedMessage = resMessage.data;
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          )
        );
        onMessageChange();
      } catch (error) {
        console.error("Error updating message:", error);
      }
    },
    [get, onMessageChange]
  );

  const handleDeleteMessageSocket = useCallback(
    (messageId: string) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
      onMessageChange();
    },
    [onMessageChange]
  );

  const handleUpdateConversationSocket = useCallback(
    async (conversationId: string) => {
      try {
        const resMessage = await get(`/v1/conversation/get/${conversationId}`);
        setIsCanUpdate(Number(resMessage.data.canUpdate));
        setIsCanMessage(Number(resMessage.data.canMessage));
        setIsCanAddMember(Number(resMessage.data.canAddMember));
      } catch (error) {
        console.error("Error updating conversation:", error);
      }
    },
    [get]
  );

  const startVideoCall = async (userId: string) => {
    try {
      // Đóng peerConnection cũ nếu tồn tại
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        console.log("Closed existing peerConnection (caller)");
      }

      peerConnectionRef.current = new RTCPeerConnection(configuration);
      console.log("New peerConnection created (caller)");

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate sent (caller):", event.candidate);
          socketVideo?.emit("ICE_CANDIDATE", {
            to: userId,
            candidate: event.candidate,
          });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        const stream = event.streams[0];
        console.log("Caller received remote track:", stream);
        console.log("Number of tracks (caller):", stream.getTracks().length);
        console.log("Video tracks (caller):", stream.getVideoTracks());
        console.log("Audio tracks (caller):", stream.getAudioTracks());
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          console.log(
            "Assigned stream to remoteVideoRef (caller):",
            remoteVideoRef.current.srcObject
          );
          remoteVideoRef.current.play().catch((error) => {
            console.error("Error playing remote video (caller):", error);
          });
        } else {
          console.error("remoteVideoRef.current is null (caller)");
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const state = peerConnectionRef.current?.iceConnectionState;
        console.log("ICE connection state (caller):", state);
        if (state === "connected" || state === "completed") {
          console.log("ICE connection established (caller)");
        } else if (state === "disconnected" || state === "failed") {
          toast.error("Kết nối video bị ngắt (caller).");
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("Local stream acquired (caller):", stream);
      console.log("Local tracks (caller):", stream.getTracks());
      console.log("Local video tracks (caller):", stream.getVideoTracks());
      console.log("Local audio tracks (caller):", stream.getAudioTracks());

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("Assigned stream to localVideoRef (caller)");
      }

      stream.getTracks().forEach((track) => {
        console.log("Adding track to peerConnection (caller):", track);
        peerConnectionRef.current?.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      console.log("Offer SDP (caller):", offer.sdp);
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log("Local description set (caller)");
      socketVideo?.emit("OFFER", { to: userId, offer });

      console.log("Offer sent successfully (caller)");
      setIsVideoCallActive(true);
      setIsCalling(true);

      // Bắt đầu đếm thời gian cuộc gọi
      setCallStartTime(new Date());
      callDurationInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting video call:", error);
      toast.error("Không thể bắt đầu cuộc gọi video.");
      setIsVideoCallActive(false);
    }
  };

  // Queue for ICE candidates that arrive before the remote description is set
  const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);

  const handleOffer = async (data: {
    to: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        console.log("Closed existing peerConnection (callee)");
      }

      peerConnectionRef.current = new RTCPeerConnection(configuration);
      console.log("New peerConnection created (callee)");

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate sent (callee):", event.candidate);
          socketVideo?.emit("ICE_CANDIDATE", {
            to: data.to,
            candidate: event.candidate,
          });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        const stream = event.streams[0];
        console.log("Callee received remote track:", stream);
        console.log("Number of tracks (callee):", stream.getTracks().length);
        console.log("Video tracks (callee):", stream.getVideoTracks());
        console.log("Audio tracks (callee):", stream.getAudioTracks());
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          console.log(
            "Assigned stream to remoteVideoRef (callee):",
            remoteVideoRef.current.srcObject
          );
          remoteVideoRef.current.play().catch((error) => {
            console.error("Error playing remote video (callee):", error);
            setTimeout(() => {
              remoteVideoRef.current
                ?.play()
                .catch((e) => console.error("Retry play failed:", e));
            }, 500);
          });
        } else {
          console.error("remoteVideoRef.current is null (callee)");
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const state = peerConnectionRef.current?.iceConnectionState;
        console.log("ICE connection state (callee):", state);
        if (state === "connected" || state === "completed") {
          console.log("ICE connection established (callee)");
        } else if (state === "disconnected" || state === "failed") {
          toast.error("Kết nối video bị ngắt (callee).");
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("Local stream acquired (callee):", stream);
      console.log("Local tracks (callee):", stream.getTracks());
      console.log("Local video tracks (callee):", stream.getVideoTracks());
      console.log("Local audio tracks (callee):", stream.getAudioTracks());

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("Assigned stream to localVideoRef (callee)");
      }

      stream.getTracks().forEach((track) => {
        console.log("Adding track to peerConnection (callee):", track);
        peerConnectionRef.current?.addTrack(track, stream);
      });

      console.log("Received Offer SDP (callee):", data.offer.sdp);
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      console.log("Remote description set (callee)");

      await processQueuedIceCandidates();

      const answer = await peerConnectionRef.current.createAnswer();
      console.log("Answer SDP (callee):", answer.sdp);
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log("Local description set (callee)");
      socketVideo?.emit("ANSWER", { to: data.to, answer });

      console.log("Answer sent successfully (callee)");
      setIsVideoCallActive(true);
    } catch (error) {
      console.error("Error handling offer:", error);
      toast.error("Không thể thiết lập kết nối video.");
      setIsVideoCallActive(false);
    }
  };

  // Add a function to process queued ICE candidates
  const processQueuedIceCandidates = async () => {
    if (peerConnectionRef.current && pendingIceCandidates.current.length > 0) {
      console.log(
        `Processing ${pendingIceCandidates.current.length} queued ICE candidates`
      );
      for (const candidate of pendingIceCandidates.current) {
        try {
          console.log("Processing queued candidate:", candidate);
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          console.log("Queued ICE candidate added successfully");
        } catch (error) {
          console.error("Error adding queued ICE candidate:", error);
        }
      }
      pendingIceCandidates.current = [];
      console.log("Cleared ICE candidate queue");
    }
  };

  const handleAnswer = async (data: {
    to: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    try {
      if (peerConnectionRef.current) {
        if (peerConnectionRef.current.signalingState === "have-local-offer") {
          console.log("Received Answer SDP (caller):", data.answer.sdp);
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log("Remote description set successfully (caller)");
          await processQueuedIceCandidates();
        } else {
          console.warn(
            "Cannot set remote description in current state (caller):",
            peerConnectionRef.current.signalingState
          );
        }
      } else {
        console.error(
          "No peer connection available when setting remote description (caller)"
        );
      }
    } catch (error) {
      console.error("Error setting remote description (caller):", error);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  };

  const handleIceCandidate = async (data: {
    to: string;
    candidate: RTCIceCandidateInit;
  }) => {
    try {
      if (peerConnectionRef.current) {
        console.log("Received ICE candidate:", data.candidate);
        if (peerConnectionRef.current.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          console.log("ICE candidate added successfully");
        } else {
          console.log("Queuing ICE candidate for later:", data.candidate);
          pendingIceCandidates.current.push(data.candidate);
        }
      } else {
        console.error("No peer connection available when adding ICE candidate");
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  const endVideoCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log("PeerConnection closed");
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track);
      });
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      console.log("Cleared localVideoRef");
    }

    // Dừng interval đếm thời gian
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
      callDurationInterval.current = null;
      console.log("Call duration interval cleared");
    }

    setIsVideoCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    setCallDuration(0);
    setCallStartTime(null);
    console.log("Video call ended");
  };

  const handleCallEndedMessage = async (data: {
    message: string;
    senderId: string;
    receiverId: string;
  }) => {
    try {
      // Chỉ gửi tin nhắn nếu người gửi là người dùng hiện tại
      if (data.senderId === userCurrent?._id) {
        console.log("duaration chatwindow", data.message);
        const encryptedMessage = encrypt(
          data.message.trim(),
          userCurrent?.secretKey
        );
        await post("/v1/message/create", {
          conversation: conversation._id,
          content: encryptedMessage,
          sender: data.senderId,
        });
        onMessageChange();
        console.log("Call ended message saved:", data.message);
      }
    } catch (error) {
      console.error("Error saving call message:", error);
    }
  };

  const handleStartVideoCall = () => {
    const receiver = membersList.find((m) => m.user._id !== userCurrent?._id);
    const receiverId = receiver?.user._id;
    if (receiverId) {
      socketVideo?.emit("START_VIDEO_CALL", {
        conversationId: conversation._id,
        callerId: userCurrent?._id,
        callerName: userCurrent?.displayName,
        callerAvatar: userCurrent?.avatarUrl,
        receiverId,
      });
      setIsCalling(true);
    } else {
      toast.error("Không tìm thấy người nhận để thực hiện cuộc gọi!");
    }
  };

  const handleCancelCall = () => {
    const receiverId = membersList.find((m) => m.user._id !== userCurrent?._id)
      ?.user._id;
    if (receiverId) {
      socketVideo?.emit("END_VIDEO_CALL", {
        conversationId: conversation._id,
        callerId: userCurrent?._id,
        receiverId,
        message: "Cuộc gọi đã bị hủy",
      });
    }
    setIsCalling(false);
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      socketVideo?.emit("ACCEPT_VIDEO_CALL", {
        callerId: incomingCall.callerId,
        receiverId: userCurrent?._id,
        conversationId: conversation._id,
      });
      setIsVideoCallActive(true);
      setIncomingCall(null);
      setCallStartTime(new Date());
      callDurationInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleRejectCall = () => {
    console.log(
      "Reject call button pressed, current incomingCall state:",
      incomingCall
    );
    if (incomingCall) {
      // Store the callerId before clearing the state
      const callerId = incomingCall.callerId;
      const conversationId = incomingCall.conversationId;

      // Clear all call-related state immediately
      setIncomingCall(null);
      setIsCalling(false);
      setIsVideoCallActive(false);

      // Then emit the rejection event
      socketVideo?.emit("REJECT_VIDEO_CALL", {
        callerId: callerId,
        receiverId: userCurrent?._id,
        conversationId: conversationId,
      });
      console.log("Call rejected, state cleared");
    }
  };

  const socketChat = useSocketChat({
    conversationId: conversation._id,
    userId: userCurrent?._id,
    remoteUrl,
    onNewMessage: handleNewMessage,
    onUpdateMessage: handleUpdateMessageSocket,
    onDeleteMessage: handleDeleteMessageSocket,
    onConversationUpdate: onMessageChange,
    onHandleUpdateConversation: handleUpdateConversationSocket,
  });

  const socketVideo = useSocketVideoCall({
    socket: socketChat,
    onIncomingVideoCall: (data) => {
      setIncomingCall(data);
    },
    onVideoCallAccepted: (data) => {
      setIsCalling(false);
      setIsVideoCallActive(true);
      startVideoCall(data.receiverId);
    },
    onVideoCallRejected: (data) => {
      console.log("Video call rejected, clearing state:", data);
      // This handler is for when the other party rejects our call
      // or when we reject their call and they receive the notification
      setIsCalling(false);
      setIncomingCall(null);
      setIsVideoCallActive(false);

      // Only show the toast notification if the user is the caller
      // if (isCalling) {
      //   toast.info("Cuộc gọi bị từ chối");
      // }
    },
    onOffer: handleOffer,
    onAnswer: handleAnswer,
    onIceCandidate: handleIceCandidate,
    onVideoCallEnded: () => {
      endVideoCall();
    },
    onCallEnded: (data) => {
      handleCallEndedMessage(data);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isScrollToBottom) {
      scrollToBottom();
      setIsScrollToBottom(false);
    }
  }, [isScrollToBottom]);

  useEffect(() => {
    getOwner();
  }, [conversation]);

  const getOwner = () => {
    if (conversation.isOwner === 1) {
      setIsOwner(conversation.owner._id === userCurrent?._id ? 1 : 0);
    }
  };

  const handleScroll = async () => {
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop === 0 &&
      !isLoadingMessages &&
      hasMore
    ) {
      const firstMessage = scrollContainerRef.current.firstElementChild;
      const previousScrollTop = scrollContainerRef.current.scrollTop;
      const previousOffsetTop = firstMessage
        ? (firstMessage as HTMLElement).offsetTop
        : 0;

      await fetchMessages(page + 1);

      if (firstMessage) {
        scrollContainerRef.current.scrollTop =
          (firstMessage as HTMLElement).offsetTop -
          previousOffsetTop +
          previousScrollTop;
      }
    }
  };

  useEffect(() => {
    fetchMessages(0);
  }, [fetchMessages]);

  // Auto-dismiss incoming call after timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (incomingCall) {
      // Auto-dismiss after 30 seconds if not answered or rejected
      timeoutId = setTimeout(() => {
        console.log("Auto-dismissing incoming call after timeout");
        if (socketVideo && userCurrent) {
          socketVideo.emit("END_VIDEO_CALL", {
            conversationId: incomingCall.conversationId,
            callerId: incomingCall.callerId,
            receiverId: userCurrent._id,
            message: "Cuộc gọi nhỡ",
          });
        }
        setIncomingCall(null);
        setIsCalling(false);
        setIsVideoCallActive(false);
      }, 30000); // 30 seconds timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [incomingCall, socketVideo, userCurrent]);

  const formatCallDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage && !selectedImage) return;
    setIsSendingMessage(true);

    let imageUrl: string | null = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage, post);
    }

    try {
      const encryptedMessage = encrypt(
        newMessage.trim(),
        userCurrent?.secretKey
      );
      await post("/v1/message/create", {
        conversation: conversation._id,
        content: encryptedMessage,
        imageUrl: imageUrl,
      });
      setNewMessage("");
      removeSelectedImage();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await del(`/v1/message/delete/${messageId}`);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleUpdateMessage = async (
    messageId: string,
    content: string,
    imageUrl: string
  ) => {
    try {
      const encryptedMessage = encrypt(content.trim(), userCurrent?.secretKey);
      const response = await put("/v1/message/update", {
        id: messageId,
        content: encryptedMessage,
        imageUrl: imageUrl,
      });
      if (response.result) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? { ...msg, content: encryptedMessage, imageUrl: imageUrl }
              : msg
          )
        );
        setEditingMessageId(null);
        setEditedMessage("");
        setEditedImageUrl("");
        toast.success("Message updated successfully!");
      }
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Error updating message");
    }
  };

  const handleReaction = async (messageId: string) => {
    try {
      if (messages.find((msg) => msg._id === messageId)?.isReacted === 1) {
        await del(`/v1/message-reaction/delete/${messageId}`);
      } else {
        await post("/v1/message-reaction/create", { message: messageId });
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const toggleDropdown = (messageId: string) => {
    setActiveDropdown(activeDropdown === messageId ? null : messageId);
  };

  const fetchFriends = async () => {
    try {
      const response = await get("/v1/friendship/list", { getListKind: 0 });
      setFriends(response.data.content);
      const membersResponse = await get(`/v1/conversation-member/list`, {
        conversation: conversation._id,
      });
      setConversationMembersIdList(
        membersResponse.data.content.map((member: any) => member.user._id)
      );
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleAddMember = async () => {
    setLoadingUpdate(true);
    try {
      const response = await post("/v1/conversation-member/add", {
        conversation: conversation._id,
        users: selectedMembers,
      });
      if (!response.result) {
        setErrorMessage("Error adding members.");
        setIsAddMemberModalOpen(false);
        setIsAlertErrorDialogOpen(true);
        return;
      }
      setIsAddMemberModalOpen(false);
      setIsAlertDialogOpen(true);
      setSelectedMembers([]);
      onConversationUpdateInfo(conversation);
    } catch (error) {
      setErrorMessage("Error adding members.");
      setIsAlertErrorDialogOpen(true);
      console.error("Error adding members:", error);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const updateConversationPermission = async (
    id: string,
    permissions: {
      canMessage?: number;
      canUpdate?: number;
      canAddMember?: number;
    }
  ) => {
    try {
      await put("/v1/conversation/permission", { id: id, ...permissions });
      if (permissions.canMessage !== undefined)
        setIsCanMessage(Number(permissions.canMessage));
      if (permissions.canUpdate !== undefined)
        setIsCanUpdate(Number(permissions.canUpdate));
      if (permissions.canAddMember !== undefined)
        setIsCanAddMember(Number(permissions.canAddMember));
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Error updating conversation permissions");
    }
  };

  const handleUpdate = async (formData: any) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      const response = await put("/v1/conversation/update", formData);
      if (!response.result) {
        setError(response.message);
        return;
      }
      setIsEditDialogOpen(false);
      onMessageChange();
      onConversationUpdateInfo(conversation);
      toast.success("Conversation updated successfully!");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleForwardMessage = (friendObject: Friends) => {
    onFowardMessage(friendObject.conversation._id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <ChatHeader
        conversation={conversation}
        userCurrent={userCurrent}
        isCanAddMember={isCanAddMember || 0}
        isCanUpdate={isCanUpdate || 0}
        isOwner={isOwner}
        onEditClick={() => setIsEditDialogOpen(true)}
        onAddMemberClick={() => {
          if (isCanAddMember === 1 || isOwner === 1) {
            fetchFriends();
            setIsAddMemberModalOpen(true);
          } else {
            toast.error("You don't have permission to add members!");
          }
        }}
        onManageMembersClick={() => setIsManageMembersModalOpen(true)}
        onLeaveGroupClick={() => {
          const memberToLeave = membersList.find(
            (member) => member.user._id === userCurrent?._id
          );
          if (memberToLeave) {
            setIsConfirmLeaveDialogOpen(true);
            setMemberIdSelected(memberToLeave._id);
          }
        }}
        onMemberListClick={() => setIsMemberListOpen(true)}
        onMessageSelect={async (messageId: string) => {
          let messageElement = document.getElementById(messageId);
          if (messageElement) {
            messageElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            messageElement.classList.add("bg-blue-100");
            setTimeout(
              () => messageElement?.classList.remove("bg-blue-100"),
              2000
            );
          } else {
            let page = 0;
            let messageFound = false;
            while (!messageFound) {
              await fetchMessages(page);
              messageElement = document.getElementById(messageId);
              if (messageElement) {
                messageFound = true;
                messageElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                messageElement.classList.add("bg-blue-100");
                setTimeout(
                  () => messageElement?.classList.remove("bg-blue-100"),
                  5000
                );
              } else {
                page++;
              }
            }
          }
        }}
        onStartVideoCall={handleStartVideoCall}
      />

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 mt-5">
        {isCalling && (
          <div className="pointer-events-auto">
            <CallingPopup
              receiverId={
                membersList.find((m) => m.user._id !== userCurrent?._id)?.user
                  ._id || ""
              }
              receiverAvatar={
                membersList.find((m) => m.user._id !== userCurrent?._id)?.user
                  .avatarUrl || ""
              }
              receiverName={
                membersList.find((m) => m.user._id !== userCurrent?._id)?.user
                  .displayName || ""
              }
              onCancelCall={handleCancelCall}
            />
          </div>
        )}

        {/* {incomingCall && !isVideoCallActive && (
          <div className="pointer-events-auto">
            <IncomingCallPopup
              callerId={incomingCall.callerId}
              callerName={incomingCall.callerName}
              callerAvatar={incomingCall.callerAvatar}
              onAcceptCall={handleAcceptCall}
              onRejectCall={handleRejectCall}
            />
          </div>
        )} */}
      </div>

      {isVideoCallActive && (
        <VideoCallModal
          localVideoRef={localVideoRef as React.RefObject<HTMLVideoElement>}
          remoteVideoRef={remoteVideoRef as React.RefObject<HTMLVideoElement>}
          onEndCall={() => {
            console.log("Ending call");
            const receiverId =
              membersList.find((m) => m.user._id !== userCurrent?._id)?.user
                ._id || "";
            const duration = formatCallDuration(callDuration);
            console.log("duration chatwindow end:", duration);
            const message = `Cuộc gọi video (${duration})`;

            // Gửi sự kiện kết thúc cuộc gọi
            // Nếu người dùng hiện tại là caller, gửi với callerId là userCurrent._id
            // Nếu người dùng hiện tại là callee, gửi với callerId là receiverId
            const isCaller = isCalling;
            socketVideo?.emit("END_VIDEO_CALL", {
              conversationId: conversation._id,
              callerId: isCaller ? userCurrent?._id : receiverId,
              receiverId: isCaller ? receiverId : userCurrent?._id,
              message: message,
            });

            endVideoCall();
          }}
          callerId={userCurrent?._id}
          receiverId={
            membersList.find((m) => m.user._id !== userCurrent?._id)?.user
              ._id || ""
          }
          localStream={localStreamRef.current}
        />
      )}

      <MessageList
        messages={messages}
        userCurrent={userCurrent}
        editingMessageId={editingMessageId}
        editedMessage={editedMessage}
        editedImageUrl={editedImageUrl}
        activeDropdown={activeDropdown}
        isLoadingMessages={isLoadingMessages}
        onEditMessage={(messageId, content, imageUrl) => {
          setEditingMessageId(messageId);
          setEditedMessage(content);
          setEditedImageUrl(imageUrl);
        }}
        onCancelEdit={() => {
          setEditingMessageId(null);
          setEditedMessage("");
          setEditedImageUrl("");
        }}
        onDeleteMessage={handleDeleteMessage}
        onReaction={handleReaction}
        onToggleDropdown={setActiveDropdown}
        onAvatarClick={handleAvatarClick}
        onScroll={handleScroll}
        isScrollToBottom={isScrollToBottom}
        onUpdateMessage={handleUpdateMessage}
      />

      <ChatInput
        newMessage={newMessage}
        selectedImage={selectedImage}
        isSendingMessage={isSendingMessage}
        isCanMessage={isCanMessage || 0}
        isOwner={isOwner}
        conversationKind={Number(conversation.kind)}
        onMessageChange={(e) => setNewMessage(e.target.value)}
        onImageSelected={(e) => {
          const file = e.target.files?.[0];
          if (file) setSelectedImage(file);
        }}
        onRemoveSelectedImage={removeSelectedImage}
        onSubmit={handleSendMessage}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        searchQuery={searchQuery}
        friends={friends}
        selectedMembers={selectedMembers}
        conversationMembersIdList={conversationMembersIdList}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onToggleMember={toggleMember}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMember}
      />

      <ManageMembersModal
        isOpen={isManageMembersModalOpen}
        isCanUpdate={isCanUpdate || 0}
        isCanMessage={isCanMessage || 0}
        isCanAddMember={isCanAddMember || 0}
        onUpdatePermission={(permissions) =>
          updateConversationPermission(conversation._id, permissions)
        }
        onClose={() => setIsManageMembersModalOpen(false)}
        onDisbandGroup={() => setIsConfirmDialogOpen(true)}
      />

      <MemberListModal
        isOpen={isMemberListOpen}
        membersList={membersList}
        loadingMembers={loadingMembers}
        isOwner={isOwner}
        onClose={() => setIsMemberListOpen(false)}
        onDeleteMember={(memberId) => {
          setIsConfirmDelMemDialogOpen(true);
          setMemberIdSelected(memberId);
        }}
        onAvatarClick={handleAvatarClick}
      />

      <AlertDialog
        isVisible={isAlertDialogOpen}
        title="Success"
        message="Members added successfully!"
        onAccept={() => setIsAlertDialogOpen(false)}
      />

      <AlertErrorDialog
        isVisible={isAlertErrorDialogOpen}
        title="Failed"
        message={errorMessage}
        onAccept={() => setIsAlertErrorDialogOpen(false)}
      />

      <ConfimationDialog
        isVisible={isConfirmDelMemDialogOpen}
        title="Confirm"
        color="red"
        message="Are you sure you want to remove this member?"
        onConfirm={() => {
          handleRemoveMember(memberIdSelected);
          setIsConfirmDelMemDialogOpen(false);
        }}
        onCancel={() => setIsConfirmDelMemDialogOpen(false)}
      />

      <ConfimationDialog
        isVisible={isConfirmDialogOpen}
        title="Confirm"
        color="red"
        message="Are you sure you want to disband the group?"
        onConfirm={() => {
          handleDisbandGroup();
          setIsConfirmDialogOpen(false);
        }}
        onCancel={() => setIsConfirmDialogOpen(false)}
      />

      <ConfimationDialog
        isVisible={isConfirmLeaveDialogOpen}
        title="Confirm"
        color="red"
        message="Are you sure you want to leave the group?"
        onConfirm={() => {
          handleLeaveGroup(memberIdSelected);
          setIsConfirmLeaveDialogOpen(false);
        }}
        onCancel={() => setIsConfirmLeaveDialogOpen(false)}
      />

      <EditProfilePopup
        conversation={conversation}
        onUpdate={handleUpdate}
        isVisible={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />

      <UserInfoPopup
        user={selectedUser}
        onClose={closePopup}
        onAddFriend={() => {}}
        onFowardMessage={handleForwardMessage}
      />

      <LoadingDialog isVisible={isLoadingUpdate} />

      {error && (
        <AlertErrorDialog
          isVisible={true}
          title="Failed"
          message={error}
          onAccept={() => setError(null)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
