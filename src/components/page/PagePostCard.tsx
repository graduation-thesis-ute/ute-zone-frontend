import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  MoreHorizontal,
  ThumbsUp,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { PagePost } from "../../models/page/PagePost";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import PostDetailDialog from "./PostDetailDialog";
import useFetch from "../../hooks/useFetch";
import { toast } from "react-toastify";

// Utility function to convert base64 to Blob
const base64ToBlob = (base64: string): Blob => {
  const byteString = atob(base64.split(",")[1]);
  const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

interface PagePostCardProps {
  post: PagePost;
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
}

interface UpdatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  post: PagePost;
  onUpdate: () => void;
}

const UpdatePostDialog: React.FC<UpdatePostDialogProps> = ({
  isOpen,
  onClose,
  post,
  onUpdate,
}) => {
  const [content, setContent] = useState(post.content);
  const [imageUrls, setImageUrls] = useState<string[]>(post.imageUrls || []);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { post: postRequest, put } = useFetch();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview && imageUrls.length === 0) return;

    try {
      setIsSubmitting(true);
      let newImageUrl = null;

      if (imagePreview) {
        try {
          const formData = new FormData();
          const imageBlob = base64ToBlob(imagePreview);
          formData.append("file", imageBlob, "post_image.jpg");
          const uploadResponse = await postRequest("/v1/file/upload", formData);
          if (uploadResponse.result) {
            newImageUrl = uploadResponse.data.filePath;
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Có lỗi xảy ra khi tải lên hình ảnh");
          setIsSubmitting(false);
          return;
        }
      }

      console.log("Updating post with data:", {
        id: post._id,
        content: content.trim(),
        imageUrls: newImageUrl ? [...imageUrls, newImageUrl] : imageUrls,
      });

      const response = await put("/v1/page-post/update", {
        id: post._id,
        content: content.trim(),
        imageUrls: newImageUrl ? [...imageUrls, newImageUrl] : imageUrls,
      });

      console.log("Update response:", response);

      if (response.result) {
        console.log("Update successful, calling onUpdate");
        toast.success("Cập nhật bài viết thành công");
        if (onUpdate) {
          onUpdate();
        }
        onClose();
      } else {
        console.error("Update failed:", response.message);
        toast.error(response.message || "Cập nhật bài viết thất bại");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Có lỗi xảy ra khi cập nhật bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cập nhật bài viết</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />

          {/* Existing images */}
          {imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrls((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New image preview */}
          {imagePreview && (
            <div className="mt-4 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <label className="cursor-pointer text-blue-500 hover:text-blue-600">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <ImageIcon size={24} />
            </label>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (!content.trim() && !imagePreview && imageUrls.length === 0)
              }
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Cập nhật</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PagePostCard: React.FC<PagePostCardProps> = ({
  post,
  onPostUpdated,
  onPostDeleted,
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [totalReactions, setTotalReactions] = useState(
    post.totalReactions || 0
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const {
    post: postRequest,
    del: deleteRequest,
    get: getRequest,
    put,
  } = useFetch();

  // Kiểm tra xem user đã thích post chưa
  const checkExistingReaction = async () => {
    try {
      // Gọi API với pagePostId và userId (current user)
      const response = await getRequest(
        `/v1/page-post-reaction/list?pagePostId=${
          post._id
        }&userId=${localStorage.getItem("userId")}`
      );
      console.log("Check reaction response:", response); // Debug log

      if (response.result && response.data && response.data.content) {
        // Nếu có reaction trong danh sách thì user đã thích
        const hasReaction = response.data.content.some(
          (reaction: any) =>
            reaction.pagePost === post._id &&
            reaction.user === localStorage.getItem("userId")
        );
        console.log("Has reaction:", hasReaction); // Debug log
        setIsLiked(hasReaction);
      } else {
        setIsLiked(false);
      }
    } catch (error) {
      console.error("Error checking existing reaction:", error);
      setIsLiked(false);
    }
  };

  // Kiểm tra reaction khi component mount và khi post thay đổi
  useEffect(() => {
    if (post._id && localStorage.getItem("userId")) {
      checkExistingReaction();
    }
  }, [post._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Kiểm tra xem nội dung có cần nút "Đọc thêm" không
  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseInt(
        window.getComputedStyle(contentRef.current).lineHeight
      );
      const height = contentRef.current.scrollHeight;
      const maxHeight = lineHeight * 3; // Hiển thị tối đa 3 dòng
      setIsContentExpanded(height <= maxHeight);
    }
  }, [post.content]);

  const handlePostClick = () => {
    setIsDetailOpen(true);
  };

  const handleLike = async () => {
    try {
      // Kiểm tra lại trạng thái like hiện tại
      await checkExistingReaction();

      // Nếu đã like thì không cho phép like thêm
      if (isLiked) {
        console.log("Already liked, cannot like again"); // Debug log
        return;
      }

      // Thêm like mới
      const response = await postRequest(`/v1/page-post-reaction/create`, {
        pagePost: post._id,
      });

      if (response.result) {
        console.log("Like successful"); // Debug log
        setIsLiked(true);
        setTotalReactions((prev) => prev + 1);
        if (onPostUpdated) {
          onPostUpdated();
        }
      }
    } catch (error) {
      console.error("Error adding like:", error);
    }
  };

  const handleUnlike = async () => {
    try {
      // Kiểm tra lại trạng thái like hiện tại
      await checkExistingReaction();

      // Nếu chưa like thì không cho phép unlike
      if (!isLiked) {
        console.log("Not liked yet, cannot unlike"); // Debug log
        return;
      }

      // Xóa like
      const response = await deleteRequest(
        `/v1/page-post-reaction/delete/${post._id}`
      );

      if (response.result) {
        console.log("Unlike successful"); // Debug log
        setIsLiked(false);
        setTotalReactions((prev) => prev - 1);
        if (onPostUpdated) {
          onPostUpdated();
        }
      }
    } catch (error) {
      console.error("Error removing like:", error);
    }
  };

  const handleDeletePost = async () => {
    setIsDeleteModalOpen(true);
    setShowDropdown(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await put("/v1/page-post/change-state", {
        id: post._id,
        status: 3,
        reason: "User requested deletion",
      });
      if (response.result) {
        toast.success("Xóa bài viết thành công");
        if (onPostDeleted) {
          onPostDeleted();
        }
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Có lỗi xảy ra khi xóa bài viết");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpdatePost = () => {
    setIsUpdateOpen(true);
    setShowDropdown(false);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Vừa xong";
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch (error) {
      return "Vừa xong";
    }
  };

  // Dynamic image grid rendering based on number of images
  const renderImageGrid = () => {
    if (!post.imageUrls || post.imageUrls.length === 0) return null;

    if (post.imageUrls.length === 1) {
      // Single image: full width
      return (
        <div className="overflow-hidden">
          <img
            src={post.imageUrls[0]}
            alt="Post image"
            className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            style={{ maxHeight: "500px" }}
            onClick={handlePostClick}
          />
        </div>
      );
    }

    if (post.imageUrls.length === 2) {
      // Two images: side by side
      return (
        <div className="grid grid-cols-2 gap-1">
          {post.imageUrls.map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handlePostClick}
              />
            </div>
          ))}
        </div>
      );
    }

    if (post.imageUrls.length === 3) {
      // Three images: one large on left, two stacked on right
      return (
        <div className="grid grid-cols-2 gap-1">
          <div className="overflow-hidden row-span-2">
            <img
              src={post.imageUrls[0]}
              alt="Post image 1"
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              style={{ height: "320px" }}
              onClick={handlePostClick}
            />
          </div>
          {post.imageUrls.slice(1, 3).map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 2}`}
                className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handlePostClick}
              />
            </div>
          ))}
        </div>
      );
    }

    if (post.imageUrls.length === 4) {
      // Four images: 2x2 grid
      return (
        <div className="grid grid-cols-2 gap-1">
          {post.imageUrls.map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handlePostClick}
              />
            </div>
          ))}
        </div>
      );
    }

    // 5 or more images: Show first 4 with a counter for remaining
    return (
      <div className="grid grid-cols-2 gap-1">
        {post.imageUrls.slice(0, 4).map((url, index) => (
          <div
            key={index}
            className={`overflow-hidden relative ${
              index === 3 && post.imageUrls!.length > 4 ? "group" : ""
            }`}
          >
            <img
              src={url}
              alt={`Post image ${index + 1}`}
              className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={handlePostClick}
            />
            {index === 3 && post.imageUrls!.length > 4 && (
              <div
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                onClick={handlePostClick}
              >
                <span className="text-white text-2xl font-bold">
                  +{post.imageUrls!.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={post.page?.avatarUrl || "/default-avatar.png"}
                  alt={post.page?.name}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                {!post.page?.avatarUrl && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-50" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-gray-900 hover:underline cursor-pointer">
                  {post.page?.name}
                </h3>
                <p className="text-xs text-gray-500 flex items-center space-x-2">
                  <span>{formatTime(post.createdAt)}</span>
                </p>
              </div>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <MoreHorizontal size={20} className="text-gray-600" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border">
                  {post.isOwner === 1 && (
                    <>
                      <button
                        onClick={handleUpdatePost}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Edit2 size={16} />
                        <span>Cập nhật bài viết</span>
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Xóa bài viết</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <div className="relative">
            <p
              ref={contentRef}
              className={`text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap ${
                !isContentExpanded ? "line-clamp-3" : ""
              }`}
            >
              {post.content}
            </p>
            {!isContentExpanded && (
              <button
                onClick={() => setIsContentExpanded(true)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1"
              >
                Đọc thêm
              </button>
            )}
          </div>
        </div>

        {/* Images - Using the new renderImageGrid function */}
        {renderImageGrid()}

        {/* Interaction counts */}
        <div className="px-4 py-2 flex items-center justify-between border-t border-b mt-3">
          <div className="flex items-center space-x-2">
            {totalReactions > 0 && (
              <>
                <div className="bg-blue-500 rounded-full p-1">
                  <ThumbsUp size={12} className="text-white" />
                </div>
                <span className="text-sm text-gray-500">
                  {totalReactions} lượt thích
                </span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span>{post.totalComments || 0} bình luận</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-2 py-1 flex justify-between">
          <button
            onClick={isLiked ? handleUnlike : handleLike}
            className={`flex items-center justify-center space-x-2 py-2 flex-1 rounded-lg hover:bg-gray-100 transition-colors ${
              isLiked ? "text-blue-500 hover:bg-blue-50" : "text-gray-600"
            }`}
          >
            <ThumbsUp size={20} className={isLiked ? "fill-current" : ""} />
            <span className="font-medium text-sm">
              {isLiked ? "Đã thích" : "Thích"}
            </span>
          </button>
          <button
            onClick={handlePostClick}
            className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <MessageCircle size={20} />
            <span className="font-medium text-sm">Bình luận</span>
          </button>
        </div>
      </div>

      <PostDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        post={post}
        onPostUpdated={onPostUpdated}
      />

      <UpdatePostDialog
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        post={post}
        onUpdate={onPostUpdated || (() => {})}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300 flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PagePostCard;
