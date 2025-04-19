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
import MyPosts from "../components/post/pages/MyPosts";
import FriendsPosts from "../components/post/pages/FriendsPosts";
import CommunityPosts from "../components/post/pages/CommunityPosts";
import useSocketChat from "../hooks/useSocketChat";
import { useSocketVideoCall } from "../hooks/useSocketVideoCall";
import { remoteUrl } from "../types/constant";
import { Menu, X } from "lucide-react";
import NotificationPanel from "../components/notification/NotificationPanel";
import NotificationPopup from "../components/notification/NotificationPopup";
import { useProfile } from "../types/UserContext";
import VideoCallModal from "../components/chat/VideoCallModal";
import { encrypt } from "../types/utils";
import IncomingCallPopup from "../components/chat/IncomingCallPopup";

export interface CallData {
  callerId: string;
  callerName: string;
  callerAvatar: string;
  conversationId: string;
}

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

  const [isInfoComingCall, setIsInfoComingCall] = useState<CallData | null>(
    null
  );
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isComingCall, setIsComingCall] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const { profile, setProfile } = useProfile();

  const initializePeerConnection = () => {
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
      if (event.candidate && isInfoComingCall) {
        socketVideo?.emit("ICE_CANDIDATE", {
          to: isInfoComingCall.callerId,
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
        handleEndCallFromCaller();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const handleConversationUpdate = useCallback(
    async (updatedConversation: Conversation) => {
      const response = await get(
        `/v1/conversation/get/${updatedConversation._id}`
      );
      setSelectedConversation(response.data);
    },
    [get]
  );

  const handleLeaveGroup = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handleFowardToConversation = useCallback(
    async (idConversation: string) => {
      const response = await get(`/v1/conversation/get/${idConversation}`);
      setSelectedConversation(response.data);
    },
    [get]
  );

  const fetchUserCurrent = useCallback(async () => {
    try {
      const response = await get("/v1/user/profile");
      setUserCurrent(response.data);
      setProfile(response.data);
    } catch (error) {
      console.error("Error getting user id:", error);
    }
  }, [get, setProfile]);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await get("/v1/conversation/list", { isPaged: 0 });
      setConversations(response.data.content);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, [get]);

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
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMessageChange = useCallback(() => {
    if (selectedSection === "messages" && userCurrent) {
      fetchConversations();
    }
  }, [fetchConversations, selectedSection, userCurrent]);

  const handleNewMessageHome = useCallback(
    (messageId: string) => {
      handleMessageChange();
    },
    [handleMessageChange]
  );

  const handleUpdateMessageHome = useCallback(
    (messageId: string) => {
      handleMessageChange();
    },
    [handleMessageChange]
  );

  const handleDeleteMessageHome = useCallback(
    (messageId: string) => {
      handleMessageChange();
    },
    [handleMessageChange]
  );

  const handleUpdateConversation = useCallback(() => {}, []);

  const socketChat = useSocketChat({
    userId: userCurrent?._id,
    remoteUrl,
    onNewMessage: handleNewMessageHome,
    onUpdateMessage: handleUpdateMessageHome,
    onDeleteMessage: handleDeleteMessageHome,
    onConversationUpdate: handleMessageChange,
    onHandleUpdateConversation: handleUpdateConversation,
  });

  const socketVideo = useSocketVideoCall({
    socket: socketChat,
    onIncomingVideoCall: (data: CallData) => {
      setIsInfoComingCall(data);
      setIsComingCall(true);
    },
    onVideoCallRejected: () => {
      setIsComingCall(false);
      setIsInfoComingCall(null);
    },
    onEndCallByCaller: () => {
      handleEndCallFromCaller();
    },
    onOffer: async (data: any) => {
      if (
        isInfoComingCall &&
        data.from === isInfoComingCall.callerId &&
        peerConnectionRef.current
      ) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
          await createAnswer();
        } catch (error) {
          console.error("Home: Error handling offer:", error);
        }
      }
    },
    onAnswer: async (data: any) => {
      if (
        isInfoComingCall &&
        data.from === isInfoComingCall.callerId &&
        peerConnectionRef.current
      ) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
        } catch (error) {
          console.error("Home: Error handling answer:", error);
        }
      }
    },
    onIceCandidate: async (data: any) => {
      if (
        isInfoComingCall &&
        data.from === isInfoComingCall.callerId &&
        peerConnectionRef.current
      ) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error("Home: Error adding ICE candidate:", error);
        }
      }
    },
    onEndCallWhileCallingByCaller: () => {
      console.log("Cuộc gọi đã bị từ chối bởi người gọi HOME.");
      setIsComingCall(false);
      setIsInfoComingCall(null);
    },
  });

  const acceptCall = async () => {
    if (!isInfoComingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      const pc = initializePeerConnection();

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      socketVideo?.emit("ACCEPT_VIDEO_CALL", {
        callerId: isInfoComingCall.callerId,
        receiverId: userCurrent?._id,
        receiverName: userCurrent?.displayName,
        receiverAvatar: userCurrent?.avatarUrl,
        conversationId: isInfoComingCall.conversationId,
      });

      setIsVideoCallActive(true);
      setIsComingCall(false);
    } catch (error) {
      console.error("Error accepting call:", error);
      alert("Không thể truy cập camera hoặc micro.");
    }
  };

  const createAnswer = async () => {
    if (peerConnectionRef.current && isInfoComingCall) {
      try {
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketVideo?.emit("ANSWER", {
          to: isInfoComingCall.callerId,
          from: userCurrent?._id,
          sdp: answer,
        });
      } catch (error) {
        console.error("Home: Error creating answer:", error);
      }
    }
  };

  const rejectCall = () => {
    if (isInfoComingCall) {
      socketVideo?.emit("END_CALL_WHILE_CALLING_FROM_RECEIVER", {
        callerId: isInfoComingCall.callerId,
      });
      setIsComingCall(false);
      setIsInfoComingCall(null);
    }
  };

  const handleEndCallFromReceiver = () => {
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

    if (isInfoComingCall) {
      socketVideo?.emit("END_VIDEO_CALL_FROM_RECEIVER", {
        callerId: isInfoComingCall.callerId,
      });
      setIsInfoComingCall(null);
    }
    peerConnectionRef.current = null;
  };

  const handleEndCallFromCaller = () => {
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
    peerConnectionRef.current = null;
    console.log("Call ended by caller HOME.");
  };

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

            {isLargeScreen && (
              <div className="flex-1 bg-gray-100 p-4">
                <NotificationPanel />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {isComingCall && isInfoComingCall && (
        <IncomingCallPopup
          callerName={isInfoComingCall.callerName}
          callerAvatar={isInfoComingCall.callerAvatar}
          onAcceptCall={acceptCall}
          onRejectCall={rejectCall}
        />
      )}

      {isVideoCallActive && (
        <VideoCallModal
          localStream={localStream}
          remoteStream={remoteStream}
          callerName={isInfoComingCall?.callerName || ""}
          callerAvatar={isInfoComingCall?.callerAvatar || ""}
          receiverName={userCurrent?.displayName || ""}
          receiverAvatar={userCurrent?.avatarUrl || ""}
          onEndCall={handleEndCallFromReceiver}
        />
      )}

      <NotificationPopup />
      <LoadingDialog isVisible={isLoading} />
    </div>
  );
};

export default Home;
