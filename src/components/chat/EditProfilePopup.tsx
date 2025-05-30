import  { useState, useEffect } from "react";
import { Edit, Camera } from "lucide-react";
import { CustomModal } from "../Dialog";
import UserIcon from "../../assets/user_icon.png";
import { uploadImage } from "../../types/utils";
import useFetch from "../../hooks/useFetch";

const EditProfilePopup = ({
  conversation,
  onUpdate,
  isVisible,
  onClose,
}: any) => {
  const [name, setName] = useState(conversation.name);
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(conversation.avatarUrl || null);
  const { post, loading } = useFetch();
  const [form, setForm] = useState({
    id: conversation._id,
    name: conversation.name,
    avatarUrl: conversation.avatar,
  });

  useEffect(() => {
    setForm({
      id: conversation._id,
      name: name,
      avatarUrl: previewUrl,
    });
  }, [name, previewUrl, conversation._id]);

  const handleAvatarChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    const updatedForm = { ...form };
    if (avatar) {
      const avatarUrl = await uploadImage(avatar, post);
      updatedForm.avatarUrl = avatarUrl;
    }
    console.log("Updated form data:", updatedForm);
    onUpdate(updatedForm);
    onClose();
  };

  return (
    <CustomModal
      isVisible={isVisible}
      title="Chỉnh sửa thông tin"
      message=""
      onClose={onClose}
    >
      <div className="space-y-8 py-2">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg transition-all duration-300 hover:shadow-xl">
              <img
                src={previewUrl ? previewUrl : UserIcon}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <label
                  htmlFor="avatar-input"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                >
                  <div className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                    <Camera size={20} className="text-blue-600" />
                  </div>
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
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tên người dùng
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10"
                />
                <Edit
                  size={16}
                  className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full pt-4">
          <button
            onClick={onClose}
            className="p-3 rounded-lg bg-gray-100 w-full text-gray-700 text-center font-medium transition-all duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:outline-none"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="p-3 rounded-lg w-full text-white text-center font-medium bg-blue-600 transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang lưu...
              </span>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </CustomModal>
  );
};

export default EditProfilePopup;
