import React, { useState } from "react";
import {
  Edit,
  UserPlus,
  Settings,
  LogOut,
  Video,
  Phone,
  Info,
  Search,
  MoreVertical,
} from "lucide-react";
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
  onStartVideoCall: () => void;
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
  onStartVideoCall,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const isGroup = conversation.kind === 1;
  // mock online status
  const isOnline = true;
  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
      {/* Left side - Conversation info */}
      <div className="flex items-center">
        <div className="relative">
          <img
            src={conversation.avatarUrl || UserIcon}
            alt={conversation.name}
            className="rounded-full w-12 h-12 object-cover border-2 border-blue-100 shadow-sm"
          />
          {/* {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}*/}
        </div>

        <div className="ml-3">
          <div className="flex items-center group">
            <h2 className="font-semibold text-gray-800">{conversation.name}</h2>
            {isGroup && (isCanUpdate === 1 || isOwner === 1) && (
              <button
                onClick={onEditClick}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full"
                title="Chỉnh sửa tên nhóm"
              >
                <Edit size={14} className="text-gray-500" />
              </button>
            )}
          </div>

          {isGroup && (
            <button
              onClick={onMemberListClick}
              className="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center mt-0.5"
            >
              <span>{conversation.totalMembers} thành viên</span>
              <Info size={12} className="ml-1" />
            </button>
          )}
          {/* {!isGroup && isOnline && (
            <p className="text-xs text-green-500 mt-0.5">Đang hoạt động</p>
          )} */}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-1">
        {/* Search Messages */}
        <MessageSearch
          conversation={conversation}
          userCurrent={userCurrent}
          onMessageSelect={onMessageSelect}
        />

        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          {/* Video Call */}
          {conversation.kind !== 1 && (
            <button
              onClick={onStartVideoCall}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Gọi video"
            >
              <Video size={20} />
            </button>
          )}

          {/* Add Member - only for groups */}
          {isGroup && (
            <button
              onClick={onAddMemberClick}
              className={`p-2 rounded-full transition-colors ${
                isCanAddMember === 1 || isOwner === 1
                  ? "hover:bg-gray-100 text-gray-600"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              disabled={isCanAddMember === 0 && isOwner === 0}
              title="Thêm thành viên"
            >
              <UserPlus size={20} />
            </button>
          )}

          {/* More Actions Button */}
          <div className="relative">
            <button
              onClick={toggleMoreMenu}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Thêm tùy chọn"
            >
              <MoreVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {isGroup && isOwner === 1 && (
                  <button
                    onClick={() => {
                      onManageMembersClick();
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  >
                    <Settings size={16} className="mr-2 text-gray-600" />
                    <span>Quản lý thành viên</span>
                  </button>
                )}

                {isGroup && isOwner !== 1 && (
                  <button
                    onClick={() => {
                      onLeaveGroupClick();
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-500 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    <span>Rời khỏi nhóm</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onMemberListClick();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                >
                  <Info size={16} className="mr-2 text-gray-600" />
                  <span>Xem thông tin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
