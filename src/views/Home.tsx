import React, { useState, useEffect, useCallback } from "react";
import NavBar from "../components/NavBar";
import { LoadingDialog } from "../components/Dialog";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../views/ChatWindow";
import WelcomeIcon from "../assets/welcome.png";
import useFetch from "../hooks/useFetch";
import { Conversation, UserProfile } from "../models/profile/chat";
import FriendListItem from "../components/friend/FriendListItem";
import FriendsList from "../components/friend/FriendsList";
import FriendRequests from "../components/friend/FriendRequests";
import PostListItem from "../components/post/pages/PostListItem";
import MyPosts from "../components/post/pages/MyPosts";
import FriendsPosts from "../components/post/pages/FriendsPosts";
import CommunityPosts from "../components/post/pages/CommunityPosts";
import Page from "../views/Page";
import useSocketChat from "../hooks/useSocketChat";
import { remoteUrl } from "../types/constant";
import { Menu, X, Bookmark, Users, Globe } from "lucide-react";
import NotificationPanel from "../components/notification/NotificationPanel";
import NotificationPopup from "../components/notification/NotificationPopup";
import { useProfile } from "../types/UserContext";
import GroupListItem from '../components/group/GroupListItem';
import Group from './Group';

const Home = () => {
  const [selectedSection, setSelectedSection] = useState("messages");
  const [selectedFriendSection, setSelectedFriendSection] = useState("friends");
  const [selectedPostSection, setSelectedPostSection] = useState("posts");
  const [selectedPageType, setSelectedPageType] = useState("my-pages");
  const [selectedGroupType, setSelectedGroupType] = useState("my-groups");
  const [userCurrent, setUserCurrent] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { get, post } = useFetch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
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
    try {
      const response = await get("/v1/conversation/list", {
        isPaged: 0,
      });
      const conversations = response.data.content;
      console.log("Fetching conversations...", conversations);
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
  }, []);

  useSocketChat({
    userId: userCurrent?._id,
    remoteUrl,
    onNewMessage: handleNewMessageHome,
    onUpdateMessage: handleUpdateMessageHome,
    onDeleteMessage: handleDeleteMessageHome,
    onConversationUpdate: handleMessageChange,
    onHandleUpdateConversation: handleUpdateConversation,
  });

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
        ) : selectedSection === "pages" ? (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Pages</h2>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setSelectedPageType("my-pages")}
                className={`flex items-center space-x-2 py-2 px-4 rounded ${
                  selectedPageType === "my-pages"
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:bg-gray-300"
                }`}
              >
                <Bookmark size={20} />
                <span>Trang của tôi</span>
              </button>
              <button
                onClick={() => setSelectedPageType("followed")}
                className={`flex items-center space-x-2 py-2 px-4 rounded ${
                  selectedPageType === "followed"
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:bg-gray-300"
                }`}
              >
                <Users size={20} />
                <span>Trang đã follow</span>
              </button>
              <button
                onClick={() => setSelectedPageType("community")}
                className={`flex items-center space-x-2 py-2 px-4 rounded ${
                  selectedPageType === "community"
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:bg-gray-300"
                }`}
              >
                <Globe size={20} />
                <span>Trang cộng đồng</span>
              </button>
            </div>
          </div>
        ) : selectedSection === "groups" ? (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Groups</h2>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setSelectedGroupType("my-groups")}
                className={`flex items-center space-x-2 py-2 px-4 rounded ${
                  selectedGroupType === "my-groups"
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:bg-gray-300"
                }`}
              >
                <Users size={20} />
                <span>Nhóm của tôi</span>
              </button>
              <button
                onClick={() => setSelectedGroupType("community-groups")}
                className={`flex items-center space-x-2 py-2 px-4 rounded ${
                  selectedGroupType === "community-groups"
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:bg-gray-300"
                }`}
              >
                <Globe size={20} />
                <span>Nhóm cộng đồng</span>
              </button>
            </div>
          </div>
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
          ) 
           : selectedFriendSection === "requests" ? (
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
        ) : selectedSection === "pages" ? (
          <div className="h-full">
            <Page pageId={selectedPageType} setSelectedPageType={setSelectedPageType} />
          </div>
        ) : selectedSection === "groups" ? (
          <div className="h-full">
            <Group groupId={selectedGroupType} setSelectedGroupType={setSelectedGroupType} />
          </div>
        ) : null}
      </div>

      <NotificationPopup />
      <LoadingDialog isVisible={isLoading} />
    </div>
  );
};

export default Home;