import React, { useState, useEffect, useRef, useCallback } from "react";
import useFetch from "../hooks/useFetch";
import useSocketChat from "../hooks/useSocketChat";
import { useSocketVideoCall } from "../hooks/useSocketVideoCall";
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
import { encrypt, uploadImage } from "../types/utils";
import { remoteUrl } from "../types/constant";
//import { data, useNavigate } from "react-router-dom";
//import { useProfile } from "../types/UserContext";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import AddMemberModal from "../components/chat/AddMemberModal";
import ManageMembersModal from "../components/chat/ManageMembersModal";
import MemberListModal from "../components/chat/MemberListModal";
import EditProfilePopup from "../components/chat/EditProfilePopup";
import UserInfoPopup from "../components/chat/UserInfoPopup";
import VideoCallModal from "../components/chat/VideoCallModal";
import CallingPopup from "../components/chat/CallingPopup";
import ringtone from "/caller-ringtone.mp3";

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
  const { get, post, del, put } = useFetch();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  //const scrollContainerRef = useRef<null | HTMLDivElement>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  //const navigate = useNavigate();
  // const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isConfirmLeaveDialogOpen, setIsConfirmLeaveDialogOpen] =
    useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [membersList, setMembersList] = useState<ConversationMembers[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isConfirmDelMemDialogOpen, setIsConfirmDelMemDialogOpen] =
    useState(false);
  const [memberIdSelected, setMemberIdSelected] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  //const { profile } = useProfile();

  const [isCalling, setIsCalling] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState<any>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  //const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);

  const initializePeerConnection = (receiverId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketVideo?.emit("ICE_CANDIDATE", {
          to: receiverId,
          from: userCurrent?._id,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const handleAvatarClick = (user: any) => {
    setSelectedUser(user);
  };

  const closePopup = () => {
    setSelectedUser(null);
  };

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
    onVideoCallAccepted: async (data: any) => {
      setReceiverInfo(null);
      const receiverId = membersList.find(
        (m) => m.user._id !== userCurrent?._id
      )?.user._id;
      if (data.receiverId === receiverId && peerConnectionRef.current) {
        setReceiverInfo(data);
        setIsCalling(false);
        setIsVideoCallActive(true);
        await createOffer();
        // Bắt đầu đếm thời gian cuộc gọi
        //setCallStartTime(new Date());
        callDurationInterval.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    },
    onVideoCallRejected: () => {
      setIsCalling(false);
    },
    onOffer: async (data: any) => {
      const receiverId = membersList.find(
        (m) => m.user._id !== userCurrent?._id
      )?.user._id;
      if (data.from === receiverId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
          await createAnswer();
        } catch (error) {
          console.error("ChatWindow: Error handling offer:", error);
        }
      }
    },
    onAnswer: async (data: any) => {
      const receiverId = membersList.find(
        (m) => m.user._id !== userCurrent?._id
      )?.user._id;
      if (data.from === receiverId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
        } catch (error) {
          console.error("ChatWindow: Error handling answer:", error);
        }
      }
    },
    onIceCandidate: async (data: any) => {
      const receiverId = membersList.find(
        (m) => m.user._id !== userCurrent?._id
      )?.user._id;
      if (data.from === receiverId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error("ChatWindow: Error adding ICE candidate:", error);
        }
      }
    },
    onEndCallWhileCallingByReceiver: () => {
      endCallWhileCallingFromReceiver();
    },
    onEndCallByReceiver: () => {
      handleEndCallByReceiver();
    },
  });

  // Khởi tạo audio element khi component mount
  useEffect(() => {
    audioRef.current = new Audio(ringtone);
    audioRef.current.loop = true; // Lặp lại âm thanh chuông
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Phát âm thanh chuông khi đang gọi
  useEffect(() => {
    if (isCalling && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing ringtone:", error);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset thời gian phát
    }
  }, [isCalling]);

  const startCall = async () => {
    try {
      const receiverId = membersList.find(
        (m) => m.user._id !== userCurrent?._id
      )?.user._id;
      setReceiverInfo({
        receiverId: receiverId,
        receiverName: membersList.find((m) => m.user._id !== userCurrent?._id)
          ?.user.displayName,
        receiverAvatar: membersList.find((m) => m.user._id !== userCurrent?._id)
          ?.user.avatarUrl,
      });

      if (!receiverId) {
        console.error("No receiver found");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsCalling(true);
      const pc = initializePeerConnection(receiverId);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      socketVideo?.emit("START_VIDEO_CALL", {
        conversationId: conversation._id,
        callerId: userCurrent?._id,
        callerName: userCurrent?.displayName,
        callerAvatar: userCurrent?.avatarUrl,
        receiverId: receiverId,
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Không thể truy cập camera hoặc micro.");
    }
  };

  const createOffer = async () => {
    const receiverId = membersList.find((m) => m.user._id !== userCurrent?._id)
      ?.user._id;
    if (peerConnectionRef.current && receiverId) {
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketVideo?.emit("OFFER", {
          to: receiverId,
          from: userCurrent?._id,
          sdp: offer,
        });
      } catch (error) {
        console.error("ChatWindow: Error creating offer:", error);
      }
    }
  };

  const createAnswer = async () => {
    const receiverId = membersList.find((m) => m.user._id !== userCurrent?._id)
      ?.user._id;
    if (peerConnectionRef.current && receiverId) {
      try {
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketVideo?.emit("ANSWER", {
          to: receiverId,
          from: userCurrent?._id,
          sdp: answer,
        });
      } catch (error) {
        console.error("ChatWindow: Error creating answer:", error);
      }
    }
  };

  const endCallWhileCalling = () => {
    const receiverId = membersList.find((m) => m.user._id !== userCurrent?._id)
      ?.user._id;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (receiverId) {
      socketVideo?.emit("END_CALL_WHILE_CALLING_FROM_CALLER", {
        receiverId: receiverId,
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setIsCalling(false);
    handleSendMessageForChat("Cuộc gọi video bị nhỡ.");
    // socketVideo?.emit("END_VIDEO_CALL", {
    //   conversationId: conversation._id,
    //   callerId: userCurrent?._id,
    //   receiverId,
    //   message: "Cuộc gọi video đã kết thúc",
    // });
    peerConnectionRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    console.log("Call ended while calling by caller ChatWindow");
  };

  const endCallWhileCallingFromReceiver = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setIsCalling(false);
    handleSendMessageForChat("Cuộc gọi video bị nhỡ.");
    // socketVideo?.emit("END_VIDEO_CALL", {
    //   conversationId: conversation._id,
    //   callerId: userCurrent?._id,
    //   receiverId,
    //   message: "Cuộc gọi video đã kết thúc",
    // });
    peerConnectionRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    console.log("Call ended while calling by receiver ChatWindow");
  };

  // Auto-dismiss incoming call after timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isCalling) {
      // Auto-dismiss after 30 seconds if not answered or rejected
      timeoutId = setTimeout(() => {
        console.log("Auto-dismissing incoming call after timeout");
        const receiverId = membersList.find(
          (m) => m.user._id !== userCurrent?._id
        )?.user._id;
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          setLocalStream(null);
        }
        if (receiverId) {
          socketVideo?.emit("END_CALL_WHILE_CALLING_FROM_CALLER", {
            receiverId: receiverId,
          });
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
        setRemoteStream(null);
        setIsCalling(false);
        handleSendMessageForChat("Cuộc gọi video bị nhỡ.");
        // socketVideo?.emit("END_VIDEO_CALL", {
        //   conversationId: conversation._id,
        //   callerId: userCurrent?._id,
        //   receiverId,
        //   message: "Cuộc gọi video đã kết thúc",
        // });
        peerConnectionRef.current = null;
        console.log("Call ended while calling by caller ChatWindow");
      }, 30000); // 30 seconds timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isCalling, socketVideo, userCurrent]);

  const endCall = () => {
    const receiverId = membersList.find((m) => m.user._id !== userCurrent?._id)
      ?.user._id;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (receiverId) {
      socketVideo?.emit("END_VIDEO_CALL_FROM_CALLER", {
        receiverId: receiverId,
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setIsVideoCallActive(false);
    const duration = formatCallDuration(callDuration);
    console.log("duration chatwindow end:", duration);
    const message = `Cuộc gọi video (${duration})`;
    handleSendMessageForChat(message);
    // Dừng interval đếm thời gian
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
      callDurationInterval.current = null;
      console.log("Call duration interval cleared");
    }
    setCallDuration(0);
    //setCallStartTime(null);
    // socketVideo?.emit("END_VIDEO_CALL", {
    //   conversationId: conversation._id,
    //   callerId: userCurrent?._id,
    //   receiverId,
    //   message: "Cuộc gọi video đã kết thúc",
    // });
    peerConnectionRef.current = null;
    console.log("Call ended by caller ChatWindow");
  };

  const handleEndCallByReceiver = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setIsVideoCallActive(false);
    const duration = formatCallDuration(callDuration);
    console.log("duration chatwindow end:", duration);
    const message = `Cuộc gọi video (${duration})`;
    handleSendMessageForChat(message);
    // Dừng interval đếm thời gian
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
      callDurationInterval.current = null;
      console.log("Call duration interval cleared");
    }
    setCallDuration(0);
    //setCallStartTime(null);
    peerConnectionRef.current = null;
    console.log("Call ended by caller ChatWindow");
  };

  const handleEndCallByCaller = () => {
    const receiverId = membersList.find((m) => m.user._id !== userCurrent?._id)
      ?.user._id;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (receiverId) {
      socketVideo?.emit("END_VIDEO_CALL_FROM_CALLER", {
        receiverId: receiverId,
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setIsVideoCallActive(false);
    const duration = formatCallDuration(callDuration);
    console.log("duration chatwindow end:", duration);
    const message = `Cuộc gọi video (${duration})`;
    handleSendMessageForChat(message);
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
      callDurationInterval.current = null;
      console.log("Call duration interval cleared");
    }
    setCallDuration(0);
    //setCallStartTime(null);
    peerConnectionRef.current = null;
    console.log("Call ended by caller ChatWindow");
  };

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
    if (hasMore && !isLoadingMessages) {
      fetchMessages(page + 1);
    }
  };

  useEffect(() => {
    fetchMessages(0);
  }, [fetchMessages]);

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

  const formatCallDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSendMessageForChat = async (newMessage: string) => {
    try {
      const encryptedMessage = encrypt(
        newMessage.trim(),
        userCurrent?.secretKey
      );
      await post("/v1/message/create", {
        conversation: conversation._id,
        content: encryptedMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
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

  // const toggleDropdown = (messageId: string) => {
  //   setActiveDropdown(activeDropdown === messageId ? null : messageId);
  // };

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
      toast.success("Cập nhật thành công!");
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
        onStartVideoCall={startCall}
      />

      {isCalling && (
        <CallingPopup
          receiverId={receiverInfo?.receiverId}
          receiverName={receiverInfo?.receiverName}
          receiverAvatar={receiverInfo?.receiverAvatar}
          onCancelCall={() => {
            endCallWhileCalling();
          }}
        />
      )}

      {isVideoCallActive && (
        <VideoCallModal
          localStream={localStream}
          remoteStream={remoteStream}
          callerName={userCurrent?.displayName || ""}
          callerAvatar={userCurrent?.avatarUrl || ""}
          receiverName={receiverInfo?.receiverName}
          receiverAvatar={receiverInfo?.receiverAvatar}
          onEndCall={handleEndCallByCaller}
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
        onDisbandGroup={() => handleDisbandGroup()}
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

      {/* <ConfimationDialog
        isVisible={isConfirmDialogOpen}
        title="Xác nhận"
        color="red"
        message="Are you sure you want to disband the group?"
        onConfirm={() => {
          handleDisbandGroup();
          setIsConfirmDialogOpen(false);
        }}
        onCancel={() => setIsConfirmDialogOpen(false)}
      /> */}

      <ConfimationDialog
        isVisible={isConfirmLeaveDialogOpen}
        title="Xác nhận"
        color="red"
        message="Bạn muốn rời khỏi nhóm này?"
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
