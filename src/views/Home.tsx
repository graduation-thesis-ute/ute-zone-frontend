import React, { useState, useEffect, useCallback, useRef } from "react";
import NavBar from "../components/NavBar";
import { LoadingDialog } from "../components/Dialog";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../views/ChatWindow";
import WelcomeIcon from "../assets/welcome.png";
import useFetch from "../hooks/useFetch";
import { Conversation, UserProfile } from "../models/profile/chat";
import FriendListItem from "../components/friend/FriendListItem";
import FriendsList from "../components/friend/FriendsList";
import GroupList from "../components/friend/GroupList";
import FriendRequests from "../components/friend/FriendRequests";
import PostListItem from "../components/post/pages/PostListItem";
//import MyPosts from "../components/post/pages/MyPosts";
import MyPosts from "../components/post/pages/MyPosts";
import FriendsPosts from "../components/post/pages/FriendsPosts";
import CommunityPosts from "../components/post/pages/CommunityPosts";
import useSocketChat from "../hooks/useSocketChat";
import useSocketVideoCall from "../hooks/useSocketVideoCall";
import { remoteUrl } from "../types/constant";
import { Menu, X } from "lucide-react";
import NotificationPanel from "../components/notification/NotificationPanel";
import NotificationPopup from "../components/notification/NotificationPopup";
import { useProfile } from "../types/UserContext";
import IncomingCallPopup from "../components/chat/IncomingCallPopup";
import VideoCallModal from "../components/chat/VideoCallModal";
import CallingPopup from "../components/chat/CallingPopup";
import { encrypt } from "../types/utils";

const Home = () => {
  const [selectedSection, setSelectedSection] = useState("messages");
  const [selectedFriendSection, setSelectedFriendSection] = useState("friends");
  const [selectedPostSection, setSelectedPostSection] = useState("posts");
  const [userCurrent, setUserCurrent] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { get, post } = useFetch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callerAvatar: string;
    conversationId: string;
  } | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callReceiverId, setCallReceiverId] = useState<string | null>(null);
  const [callReceiverName, setCallReceiverName] = useState<string | null>(null);
  const [callReceiverAvatar, setCallReceiverAvatar] = useState<string | null>(
    null
  );
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const { profile, setProfile } = useProfile();

  const handleConversationUpdate = useCallback(
    async (updatedConversation: Conversation) => {
      console.log("Conversation updated in Home:", updatedConversation);
      const response = await get(
        `/v1/conversation/get/${updatedConversation._id}`
      );
      const updatedConversationObject = response.data;
      console.log("Updated conversation object:", updatedConversationObject);
      setSelectedConversation(updatedConversationObject);
    },
    []
  );

  const handleLeaveGroup = useCallback(
    async (updatedConversation: Conversation) => {
      console.log("Updated conversation object:", updatedConversation);
      setSelectedConversation(null);
    },
    []
  );

  const handleFowardToConversation = useCallback(
    async (idConversation: string) => {
      console.log("id Conversation updated in Home:", idConversation);
      const response = await get(`/v1/conversation/get/${idConversation}`);
      const updatedConversationObject = response.data;
      console.log("Updated conversation object:", updatedConversationObject);
      setSelectedConversation(updatedConversationObject);
    },
    []
  );

  const fetchUserCurrent = useCallback(async () => {
    try {
      const response = await get("/v1/user/profile");
      setUserCurrent(response.data);
      setProfile(response.data);
      console.log("User ID fetched in Home:", response.data._id);
    } catch (error) {
      console.error("Error getting user id:", error);
    }
  }, [get]);

  const fetchConversations = useCallback(async () => {
    // if (selectedSection !== "messages" || !userCurrent) return;
    try {
      const response = await get("/v1/conversation/list", {
        isPaged: 0,
      });
      const conversations = response.data.content;
      console.log("Fetching conversations...", conversations);
      // const filteredConversations = conversations.filter(
      //   (conversation: Conversation) =>
      //     conversation.lastMessage || conversation.kind === 1
      // );
      // setConversations(filteredConversations);
      setConversations(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, [selectedSection, get, userCurrent]);

  useEffect(() => {
    fetchUserCurrent();
  }, [fetchUserCurrent]);

  useEffect(() => {
    if (selectedSection === "messages" && userCurrent) {
      fetchConversations();
    }
  }, [selectedSection, userCurrent, fetchConversations]);
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);

    // Xóa sự kiện lắng nghe khi component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const handleMessageChange = useCallback(() => {
    if (selectedSection === "messages" && userCurrent) {
      console.log("Message changed, updating conversations...");
      fetchConversations();
    }
  }, [fetchConversations, selectedSection, userCurrent]);

  const handleNewMessageHome = useCallback(
    (messageId: string) => {
      console.log("New message received in Home:", messageId);
      handleMessageChange();
    },
    [handleMessageChange]
  );

  const handleUpdateMessageHome = useCallback(
    (messageId: string) => {
      console.log("Message updated in Home:", messageId);
      handleMessageChange();
    },
    [handleMessageChange]
  );

  const handleDeleteMessageHome = useCallback(
    (messageId: string) => {
      console.log("Message deleted in Home:", messageId);
      handleMessageChange();
    },
    [handleMessageChange]
  );

  const handleUpdateConversation = useCallback(() => {
    console.log("Conversation updated in Home");
    // handleMessageChange();
  }, []);

  // Initialize socket connection
  const socketChat = useSocketChat({
    userId: userCurrent?._id,
    remoteUrl,
    onNewMessage: handleNewMessageHome,
    onUpdateMessage: handleUpdateMessageHome,
    onDeleteMessage: handleDeleteMessageHome,
    onConversationUpdate: handleMessageChange,
    onHandleUpdateConversation: handleUpdateConversation,
  });

  // Handle incoming video call
  const handleIncomingVideoCall = useCallback(
    async (data: {
      callerId: string;
      callerName: string;
      callerAvatar: string;
      conversationId: string;
    }) => {
      console.log("Incoming video call in Home:", data);
      setIncomingCall(data);

      // Fetch caller information
      try {
        const response = await get(`/v1/user/profile/${data.callerId}`);
        if (response.data) {
          setCallReceiverName(response.data.displayName);
          setCallReceiverAvatar(response.data.avatarUrl);
        }
      } catch (error) {
        console.error("Error fetching caller information:", error);
      }
    },
    [get]
  );

  // Handle video call accepted
  const handleVideoCallAccepted = useCallback(
    (data: { receiverId: string; conversationId: string }) => {
      console.log("Video call accepted in Home:", data);
      // Find the conversation and select it
      const conversation = conversations.find(
        (c) => c._id === data.conversationId
      );
      if (conversation) {
        setSelectedConversation(conversation);
        setSelectedSection("messages");
      }
    },
    [conversations]
  );

  // Handle video call rejected
  const handleVideoCallRejected = useCallback(() => {
    console.log("Video call rejected in Home");
    setIncomingCall(null);
    setCallReceiverId(null);
    setCallReceiverName(null);
    setCallReceiverAvatar(null);
  }, []);

  // Handle video call ended
  const handleVideoCallEnded = useCallback(() => {
    console.log("Video call ended in Home");
    setIsVideoCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    setCallReceiverId(null);
    setCallStartTime(null);
    setCallDuration(0);

    // Clear call duration interval
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
      callDurationInterval.current = null;
    }

    // Clean up resources
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  // Handle accept call
  const handleAcceptCall = useCallback(async () => {
    if (incomingCall && userCurrent) {
      // Set up video call
      try {
        // Create peer connection
        const configuration = {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        };

        peerConnectionRef.current = new RTCPeerConnection(configuration);

        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            peerConnectionRef.current?.addTrack(track, localStreamRef.current);
          }
        });

        // Set up event handlers
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && socketChat) {
            socketChat.emit("ICE_CANDIDATE", {
              to: incomingCall.callerId,
              candidate: event.candidate,
            });
          }
        };

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Create and send answer
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        if (socketChat) {
          socketChat.emit("ANSWER", {
            to: incomingCall.callerId,
            answer: offer,
          });
        }

        // Accept the call
        if (socketChat) {
          socketChat.emit("ACCEPT_VIDEO_CALL", {
            callerId: incomingCall.callerId,
            receiverId: userCurrent._id,
            conversationId: incomingCall.conversationId,
          });
        }

        // Activate video call
        setIsVideoCallActive(true);
        setCallReceiverId(incomingCall.callerId);
        setCurrentConversationId(incomingCall.conversationId);
        setIncomingCall(null);

        // Start tracking call duration
        setCallStartTime(new Date());
        callDurationInterval.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error("Error setting up video call:", error);
      }
    }
  }, [incomingCall, userCurrent, socketChat]);

  // Handle reject call
  const handleRejectCall = useCallback(() => {
    if (incomingCall && userCurrent && socketChat) {
      socketChat.emit("REJECT_VIDEO_CALL", {
        callerId: incomingCall.callerId,
        receiverId: userCurrent._id,
        conversationId: incomingCall.conversationId,
        message: "Cuộc gọi bị huỷ",
      });
    }
    // Clear all call-related state
    setIncomingCall(null);
    setCallReceiverId(null);
    setCallReceiverName(null);
    setCallReceiverAvatar(null);
  }, [incomingCall, userCurrent, socketChat]);

  // Handle end call
  const handleEndCall = useCallback(() => {
    if (callReceiverId && userCurrent && socketChat) {
      console.log("Ending call home neeee...");
      // Format call duration
      const duration = formatCallDuration(callDuration);
      const message = `Cuộc gọi video (${duration})`;

      console.log("conhome", currentConversationId);
      // When the callee ends the call, we need to swap the caller and receiver IDs
      socketChat.emit("END_VIDEO_CALL", {
        conversationId: currentConversationId || "",
        callerId: callReceiverId, // The original caller's ID
        receiverId: userCurrent._id, // The current user's ID (callee)
        message: message,
      });

      // Clean up resources
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Reset all call-related states
      setIsVideoCallActive(false);
      setIsCalling(false);
      setIncomingCall(null);
      setCallReceiverId(null);
      setCallReceiverName(null);
      setCallReceiverAvatar(null);
      setCallStartTime(null);
      setCallDuration(0);
      setCurrentConversationId(null);

      // Clear call duration interval
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
        callDurationInterval.current = null;
      }
    }
  }, [
    callReceiverId,
    userCurrent,
    socketChat,
    currentConversationId,
    callDuration,
  ]);

  // Format call duration
  const formatCallDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle offer from caller
  const handleOffer = useCallback(
    async (data: any) => {
      if (!peerConnectionRef.current || !localStreamRef.current) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        if (socketChat) {
          socketChat.emit("ANSWER", {
            to: data.from,
            answer: answer,
          });
        }
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    },
    [socketChat]
  );

  // Handle answer from callee
  const handleAnswer = useCallback(async (data: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (data: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }, []);

  // Handle call ended message
  const handleCallEnded = useCallback(
    async (data: { message: string; senderId: string; receiverId: string }) => {
      console.log("Call ended message:", data);

      try {
        console.log("end home");
        // Chỉ gửi tin nhắn nếu người gửi là người dùng hiện tại
        // if (data.senderId === userCurrent?._id) {
        // Tìm conversation dựa trên người nhận
        const conversation = conversations.find(
          (c) => c.kind === 1 && c._id === incomingCall?.conversationId
        );

        if (conversation) {
          const encryptedMessage = encrypt(
            data.message.trim(),
            userCurrent?.secretKey
          );
          console.log("message duaration", data.message);
          await post("/v1/message/create", {
            conversation: conversation._id,
            content: encryptedMessage,
            sender: data.senderId,
          });
          console.log("Call ended message saved:", data.message);

          // Nếu đang ở trong conversation này, cập nhật danh sách tin nhắn
          if (selectedConversation?._id === conversation._id) {
            handleMessageChange();
          }
          // }
        }
      } catch (error) {
        console.error("Error saving call message:", error);
      }
    },
    [
      userCurrent,
      conversations,
      selectedConversation,
      post,
      handleMessageChange,
      incomingCall,
    ]
  );

  // Set up video call socket
  useSocketVideoCall({
    socket: socketChat,
    onIncomingVideoCall: handleIncomingVideoCall,
    onVideoCallAccepted: handleVideoCallAccepted,
    onVideoCallRejected: handleVideoCallRejected,
    onVideoCallEnded: handleVideoCallEnded,
    onOffer: handleOffer,
    onAnswer: handleAnswer,
    onIceCandidate: handleIceCandidate,
    onCallEnded: handleCallEnded,
  });

  // Auto-dismiss incoming call after timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (incomingCall) {
      // Auto-dismiss after 30 seconds if not answered or rejected
      timeoutId = setTimeout(() => {
        console.log("Auto-dismissing incoming call after timeout");
        if (socketChat && userCurrent) {
          socketChat.emit("END_VIDEO_CALL", {
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
  }, [incomingCall, socketChat, userCurrent]);

  return (
    <div className="flex h-screen">
      <NavBar setSelectedSection={setSelectedSection} />

      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-full shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:relative
          w-3/4 lg:w-1/4
          h-full
          bg-gray-200
          transition-transform duration-300 ease-in-out
          z-40
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {selectedSection === "messages" ? (
          <ChatList
            conversations={conversations}
            onSelectConversation={(conversation) => {
              setSelectedConversation(conversation);
              setIsSidebarOpen(false);
            }}
            userCurrent={userCurrent}
            handleConversationCreated={handleMessageChange}
          />
        ) : selectedSection === "friends" ? (
          <FriendListItem
            selectedFriendSection={selectedFriendSection}
            setSelectedFriendSection={setSelectedFriendSection}
          />
        ) : selectedSection === "posts" ? (
          <PostListItem
            selectedPostSection={selectedPostSection}
            setSelectedPostSection={setSelectedPostSection}
          />
        ) : null}
      </div>

      <div className="flex-1 bg-white">
        {selectedSection === "messages" ? (
          selectedConversation ? (
            <ChatWindow
              key={selectedConversation._id}
              conversation={selectedConversation}
              userCurrent={userCurrent}
              onMessageChange={handleMessageChange}
              onConversationUpdateInfo={handleConversationUpdate}
              handleLeaveGroupUpdate={handleLeaveGroup}
              handleConversationDeleted={handleMessageChange}
              onFowardMessage={handleFowardToConversation}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4 bg-gray-100 p-6 rounded-lg shadow-lg">
              <p className="text-lg font-semibold text-gray-800">
                Chào mừng đến với{" "}
                <span className="text-blue-600">UTE Zone</span>
              </p>
              <img
                src={WelcomeIcon}
                alt="Welcome icon"
                className="w-1/2 md:w-1/3 lg:w-1/4 rounded-full shadow-md"
              />
              <div className="text-gray-600 text-sm italic text-center">
                Chọn một cuộc trò chuyện để bắt đầu
              </div>
            </div>
          )
        ) : selectedSection === "friends" ? (
          selectedFriendSection === "friends" ? (
            <FriendsList />
          ) : selectedFriendSection === "groups" ? (
            <GroupList />
          ) : selectedFriendSection === "requests" ? (
            <FriendRequests />
          ) : (
            <FriendsList />
          )
        ) : selectedSection === "posts" ? (
          <div className="flex h-full">
            <div
              className={`bg-white p-4 ${isLargeScreen ? "w-2/3" : "w-full"}`}
            >
              {selectedPostSection === "myPosts" ? (
                <MyPosts />
              ) : selectedPostSection === "friendsPosts" ? (
                <FriendsPosts />
              ) : selectedPostSection === "communityPosts" ? (
                <CommunityPosts />
              ) : (
                <MyPosts />
              )}
            </div>

            {/* Phần thông báo */}
            {isLargeScreen && (
              <div className="flex-1 bg-gray-100 p-4">
                <NotificationPanel />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Incoming call popup */}
      {incomingCall && (
        <IncomingCallPopup
          callerId={incomingCall.callerId}
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          onAcceptCall={handleAcceptCall}
          onRejectCall={handleRejectCall}
        />
      )}

      {/* Video call modal */}
      {isVideoCallActive && (
        <VideoCallModal
          localVideoRef={localVideoRef as React.RefObject<HTMLVideoElement>}
          remoteVideoRef={remoteVideoRef as React.RefObject<HTMLVideoElement>}
          onEndCall={handleEndCall}
          callerId={userCurrent?._id}
          receiverId={callReceiverId || ""}
          receiverName={callReceiverName || undefined}
          receiverAvatar={callReceiverAvatar || undefined}
          callerName={userCurrent?.displayName}
          callerAvatar={userCurrent?.avatarUrl}
          localStream={localStreamRef.current}
        />
      )}

      <NotificationPopup />
      <LoadingDialog isVisible={isLoading} />
    </div>
  );
};

export default Home;
