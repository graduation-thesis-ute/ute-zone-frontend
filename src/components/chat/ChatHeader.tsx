import React from "react";
import { Edit, UserPlus, Settings, LogOut } from "lucide-react";
import UserIcon from "../../assets/user_icon.png";
import MessageSearch from "./MessageSearch";
import { Conversation } from "../../models/profile/chat";

interface ChatHeaderProps {
  conversation: Conversation;
  userCurrent: any;
  isCanAddMember: number;
  isCanUpdate: number;
  isOwner: number;
  onEditClick: () => void;
  onAddMemberClick: () => void;
  onManageMembersClick: () => void;
  onLeaveGroupClick: () => void;
  onMemberListClick: () => void;
  onMessageSelect: (messageId: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  userCurrent,
  isCanAddMember,
  isCanUpdate,
  isOwner,
  onEditClick,
  onAddMemberClick,
  onManageMembersClick,
  onLeaveGroupClick,
  onMemberListClick,
  onMessageSelect,
}) => {
  return (
    <div className="bg-white p-4 border-b shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img
          src={conversation.avatarUrl || UserIcon}
          alt="Avatar"
          className="rounded-full w-12 h-12 object-cover border-4 border-blue-100 shadow-lg"
        />
        <div>
          <div className="flex items-center space-x-2 group">
            <h2 className="text-xl font-semibold mr-2">{conversation.name}</h2>
            {conversation.kind === 1 &&
              (isCanUpdate === 1 || isOwner === 1) && (
                <button
                  onClick={onEditClick}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit
                    size={18}
                    className="text-gray-600 hover:text-gray-900"
                  />
                </button>
              )}
          </div>
          {conversation.totalMembers > 1 && (
            <p
              className={`text-sm text-gray-500 ${
                conversation.isOwner === 1
                  ? "cursor-pointer hover:underline"
                  : ""
              }`}
              onClick={onMemberListClick}
            >
              {conversation.totalMembers} thành viên
            </p>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center space-x-2">
        <MessageSearch
          conversation={conversation}
          userCurrent={userCurrent}
          onMessageSelect={onMessageSelect}
        />

        {conversation.kind === 1 && (
          <button
            onClick={onAddMemberClick}
            className={`p-2 rounded-full text-white transition-colors ${
              isCanAddMember === 1 || isOwner === 1
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={isCanAddMember === 0 && isOwner === 0}
          >
            <UserPlus size={20} />
          </button>
        )}

        {isOwner === 1 && conversation.kind === 1 && (
          <button
            onClick={onManageMembersClick}
            className="p-2 ml-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Settings size={20} />
          </button>
        )}

        {isOwner !== 1 && conversation.kind === 1 && (
          <button
            onClick={onLeaveGroupClick}
            className="p-2 ml-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
