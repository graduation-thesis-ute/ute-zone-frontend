import React, { useState, useEffect } from "react";
import { UserProfile } from "../../models/profile/chat";
import useFetch from "../../hooks/useFetch";
import { Friends } from "../../models/profile/chat";
import { AlertDialog, AlertErrorDialog } from "../Dialog";
import useDialog from "../../hooks/useDialog";
import { uploadImage } from "../../types/utils";
import { Edit, Search, Users, X, Loader2 } from "lucide-react";
import UserIcon from "../../assets/user_icon.png";

interface CreateGroupModalProps {
  onClose: () => void;
  userCurrent: UserProfile | null;
  handleConversationCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  onClose,
  userCurrent,
  handleConversationCreated,
}) => {
  const [groupName, setGroupName] = useState("");
  const [friendsList, setFriendsList] = useState<Friends[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isDialogVisible, showDialog, hideDialog } = useDialog();
  const [isSuccessDialogVisible, setSuccessDialogVisible] = useState(false);
  const { get, post } = useFetch();
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const filteredFriends = friendsList.filter((friend) =>
    friend.friend.displayName
      .toLowerCase()
      .includes(searchFriendQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoadingFriends(true);
        const response = await get("/v1/friendship/list", { getListKind: 0 });
        if (response.result) {
          setFriendsList(response.data.content);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bạn bè:", error);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, []);

  // Thêm hoặc loại bỏ thành viên khỏi danh sách chọn
  const toggleMember = (userId: string) => {
    setSelectedMembers((prevMembers) =>
      prevMembers.includes(userId)
        ? prevMembers.filter((id) => id !== userId)
        : [...prevMembers, userId]
    );
  };

  // Xử lý tạo nhóm mới
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Vui lòng nhập tên nhóm");
      showDialog();
      return;
    }
    if (selectedMembers.length < 2) {
      setError("Vui lòng chọn ít nhất 2 thành viên");
      showDialog();
      return;
    }

    try {
      setLoading(true);

      let avatarUrl = null;
      if (avatar) {
        avatarUrl = await uploadImage(avatar, post);
      }

      const payload = {
        name: groupName,
        conversationMembers: selectedMembers,
        avatarUrl: avatarUrl,
      };

      const response = await post("/v1/conversation/create", payload);
      if (response.result) {
        setSuccessDialogVisible(true);
        handleConversationCreated();
      } else {
        setError("Đã xảy ra lỗi khi tạo nhóm");
        showDialog();
      }
    } catch (error) {
      setError("Đã xảy ra lỗi khi tạo nhóm");
      showDialog();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setError("");
    hideDialog();
  };

  const handleAccept = () => {
    setSuccessDialogVisible(false);
    onClose();
  };

  // Lấy ra các friend đã được chọn
  const getSelectedFriends = () => {
    return friendsList.filter((friend) =>
      selectedMembers.includes(friend.friend._id)
    );
  };

  // Xóa thành viên đã chọn
  const removeMember = (userId: string) => {
    setSelectedMembers((prevMembers) =>
      prevMembers.filter((id) => id !== userId)
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Tạo nhóm mới</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-blue-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Avatar upload */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
                <img
                  src={previewUrl ? previewUrl : UserIcon}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <label
                htmlFor="avatar-input"
                className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors"
              >
                <Edit size={16} />
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          {/* Group name input */}
          <div className="mb-6">
            <label
              htmlFor="group-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tên nhóm
            </label>
            <input
              id="group-name"
              type="text"
              placeholder="Nhập tên nhóm..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Selected members */}
          {selectedMembers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Thành viên đã chọn ({selectedMembers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {getSelectedFriends().map((friend) => (
                  <div
                    key={`selected-${friend.friend._id}`}
                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full flex items-center text-sm"
                  >
                    <span className="mr-1">{friend.friend.displayName}</span>
                    <button
                      onClick={() => removeMember(friend.friend._id)}
                      className="hover:bg-blue-100 rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-700">
                Chọn thành viên
              </h3>
              <span className="text-xs text-gray-500">
                Tối thiểu 2 thành viên
              </span>
            </div>

            {/* Search input */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm bạn bè..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchFriendQuery}
                onChange={(e) => setSearchFriendQuery(e.target.value)}
              />
            </div>

            {/* Friends list */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              {loadingFriends ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">
                    Đang tải danh sách bạn bè...
                  </span>
                </div>
              ) : filteredFriends.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.friend._id}
                      className={`flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                        selectedMembers.includes(friend.friend._id)
                          ? "bg-blue-50"
                          : ""
                      }`}
                      onClick={() => toggleMember(friend.friend._id)}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <img
                          src={friend.friend.avatarUrl || UserIcon}
                          alt={friend.friend.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {friend.friend.displayName}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-blue-500"
                          checked={selectedMembers.includes(friend.friend._id)}
                          onChange={() => {}} // Handled by parent div click
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Users size={32} className="text-gray-400 mb-2" />
                  <p className="text-gray-500">Không tìm thấy bạn bè nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              onClick={handleCreateGroup}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Đang tạo...
                </>
              ) : (
                "Tạo nhóm"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AlertErrorDialog
        isVisible={isDialogVisible}
        title="Lỗi"
        color="red"
        message={error}
        onAccept={handleConfirm}
      />
      <AlertDialog
        isVisible={isSuccessDialogVisible}
        title="Thông báo"
        message="Tạo nhóm thành công"
        onAccept={handleAccept}
      />
    </div>
  );
};

export default CreateGroupModal;
