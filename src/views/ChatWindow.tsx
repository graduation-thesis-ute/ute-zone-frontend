import React, { useState, useEffect, useRef, useCallback } from "react";
import useFetch from "../hooks/useFetch";
import useSocketChat from "../hooks/useSocketChat";
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
  const [updatedGroupName, setUpdatedGroupName] = useState(conversation.name);
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

  const [selectedUser, setSelectedUser] = useState(null);
  const { profile } = useProfile();

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
        } else {
          console.error("Không có dữ liệu thành viên");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách thành viên:", error);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembersList();
  }, [conversation._id]);

  console.log("Members list:", membersList);

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
      console.error("Lỗi khi lấy danh sách thành viên:", error);
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
      } else {
        alert("Xóa thành viên thất bại.");
      }
    } catch (error) {
      console.error("Lỗi khi xóa thành viên:", error);
      alert("Đã xảy ra lỗi khi xóa thành viên.");
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
      console.error("Lỗi khi giải tán nhóm:", error);
      alert("Đã xảy ra lỗi khi giải tán nhóm. Vui lòng thử lại sau.");
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
      console.error("Lỗi khi rời nhóm:", error);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const deleteConversation = async (conversationId: any) => {
    try {
      const response = await del(`/v1/conversation/delete/${conversationId}`);
      if (response.result) {
        console.log("Xóa nhóm thành công:", response);
      }
    } catch (error) {
      setErrorMessage("Có lỗi xảy ra khi giải tán nhóm.");
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
          // First load - show newest messages
          setMessages(newMessages.reverse());
          setIsScrollToBottom(true);
        } else {
          const newMessagesReverse = newMessages.reverse();
          // Loading more - add older messages to the beginning
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
        // Add new message to the end of the list
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
      console.log("Updating message socket:", messageId);
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
        console.error("Error fetching updated message and reactions:", error);
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
        console.error("Error fetching updated message and reactions:", error);
      }
    },
    [get]
  );

  useSocketChat({
    conversationId: conversation._id,
    userId: userCurrent?._id,
    remoteUrl,
    onNewMessage: handleNewMessage,
    onUpdateMessage: handleUpdateMessageSocket,
    onDeleteMessage: handleDeleteMessageSocket,
    onConversationUpdate: onMessageChange,
    onHandleUpdateConversation: handleUpdateConversationSocket,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    setIsScrollToBottom(false);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage && !selectedImage) return;
    setIsSendingMessage(true);

    let imageUrl: string | null = null;

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage, post);
    }

    console.log("Image URL:", imageUrl);

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
      console.error("Error creating message:", error);
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
        // Update the message in the local state
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  content: encryptedMessage,
                  imageUrl: imageUrl,
                }
              : msg
          )
        );
        setEditingMessageId(null);
        setEditedMessage("");
        setEditedImageUrl("");
        toast.success("Cập nhật tin nhắn thành công!");
      } else {
        toast.error("Có lỗi xảy ra khi cập nhật tin nhắn");
      }
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Có lỗi xảy ra khi cập nhật tin nhắn");
    }
  };

  const handleReaction = async (messageId: string) => {
    try {
      if (messages.find((msg) => msg._id === messageId)?.isReacted === 1) {
        await del(`/v1/message-reaction/delete/${messageId}`);
      } else {
        await post("/v1/message-reaction/create", {
          message: messageId,
        });
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
      const response = await get("/v1/friendship/list", {
        getListKind: 0,
      });
      console.log("List ban be:", response.data.content);
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
      console.log("Response add member:", response.result);
      if (!response.result) {
        setErrorMessage(
          response.message || "Có lỗi xảy ra khi thêm thành viên."
        );
        console.error("Error adding members:", response.message);
        setIsAddMemberModalOpen(false);
        setIsAlertErrorDialogOpen(true);
        return;
      }
      setIsAddMemberModalOpen(false);
      setIsAlertDialogOpen(true);
      setSelectedMembers([]);
      onConversationUpdateInfo(conversation);
    } catch (error) {
      setErrorMessage("Có lỗi xảy ra khi thêm thành viên.");
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
      const responsePermission = await put("/v1/conversation/permission", {
        id: id,
        ...permissions,
      });
      console.log("Response permission:", responsePermission);
      if (permissions.canMessage !== undefined) {
        setIsCanMessage(Number(permissions.canMessage));
      }
      if (permissions.canUpdate !== undefined) {
        setIsCanUpdate(Number(permissions.canUpdate));
      }
      if (permissions.canAddMember !== undefined) {
        setIsCanAddMember(Number(permissions.canAddMember));
      }
    } catch (error) {
      console.error("Error updating conversation permissions:", error);
      toast.error("Có lỗi xảy ra khi cập nhật quyền cuộc trò chuyện");
    }
  };

  const handleUpdate = async (formData: any) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      console.log("Data to send", formData);
      const response = await put("/v1/conversation/update", formData);
      if (!response.result) {
        setError(response.message);
        return;
      }
      setIsEditDialogOpen(false);
      onMessageChange();
      onConversationUpdateInfo(conversation);
      toast.success("Cập nhật thông tin cuộc trò chuyện thành công!");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            toast.error(
              "Bạn không có quyền thêm thành viên vào cuộc trò chuyện này!"
            );
            return;
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
          let messageElement: HTMLElement | null =
            document.getElementById(messageId);
          if (messageElement) {
            messageElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            messageElement.classList.add("bg-blue-100");
            setTimeout(() => {
              messageElement?.classList.remove("bg-blue-100");
            }, 2000);
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
                setTimeout(() => {
                  messageElement?.classList.remove("bg-blue-100");
                }, 5000);
              } else {
                page++;
              }
            }
          }
        }}
      />

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
        onScroll={() => {
          if (hasMore && !isLoadingMessages) {
            fetchMessages(page + 1);
          }
        }}
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
          if (file) {
            setSelectedImage(file);
          }
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
        onToggleMember={(userId) => {
          setSelectedMembers((prevMembers) =>
            prevMembers.includes(userId)
              ? prevMembers.filter((id) => id !== userId)
              : [...prevMembers, userId]
          );
        }}
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
        title="Thành công"
        message="Bạn đã thêm thành viên thành công!"
        onAccept={() => {
          setIsAlertDialogOpen(false);
        }}
      />

      <AlertErrorDialog
        isVisible={isAlertErrorDialogOpen}
        title="Thất bại"
        message={errorMessage}
        onAccept={() => {
          setIsAlertErrorDialogOpen(false);
        }}
      />

      <ConfimationDialog
        isVisible={isConfirmDelMemDialogOpen}
        title="Xác nhận"
        color="red"
        message="Bạn có chắc chắn muốn xoá thành viên này ra khỏi nhóm?"
        onConfirm={() => {
          handleRemoveMember(memberIdSelected);
          setIsConfirmDelMemDialogOpen(false);
        }}
        onCancel={() => setIsConfirmDelMemDialogOpen(false)}
      />

      <ConfimationDialog
        isVisible={isConfirmDialogOpen}
        title="Xác nhận"
        color="red"
        message="Bạn có chắc chắn muốn giải tán nhóm?"
        onConfirm={() => {
          handleDisbandGroup();
          setIsConfirmDialogOpen(false);
        }}
        onCancel={() => setIsConfirmDialogOpen(false)}
      />

      <ConfimationDialog
        isVisible={isConfirmLeaveDialogOpen}
        title="Xác nhận"
        color="red"
        message="Bạn có chắc chắn muốn rời nhóm?"
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

      {error &&
        AlertErrorDialog({
          isVisible: true,
          title: "Thất bại",
          message: error,
          onAccept: () => setError(null),
        })}
    </div>
  );
};

export default ChatWindow;
