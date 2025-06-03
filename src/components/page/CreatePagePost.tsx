import React, { useState } from 'react';
import { X, Image as ImageIcon, Send, Loader2, AlertCircle, CircleCheckBigIcon } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { uploadImage2 } from '../../types/utils';
import { toast } from 'react-toastify';

interface CreatePagePostProps {
  pageId: string;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePagePost: React.FC<CreatePagePostProps> = ({ pageId, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { post, get } = useFetch();

  // Thêm hàm kiểm tra status của page
  const checkPageStatus = async () => {
    try {
      console.log("Checking page status for pageId:", pageId);
      const response = await get(`/v1/page/${pageId}`);
      console.log("Page status response:", response);
      
      if (response.result) {
        const pageStatus = response.data.status;
        console.log("Page status:", pageStatus);
        
        if (pageStatus === 3) {
          console.log("Page is rejected, showing error toast");
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <span>Trang của bạn đã bị từ chối do vi phạm nội dung và không được duyệt.</span>
            </div>,
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              theme: "colored", // Thêm theme để thông báo nổi bật hơn
              style: {
                background: '#FEE2E2', // Màu nền đỏ nhạt
                color: '#991B1B', // Màu chữ đỏ đậm
                fontSize: '14px',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }
            }
          );
          onClose();
          return false;
        }
        return true;
      }
      return true;
    } catch (error) {
      console.error('Error checking page status:', error);
      return true;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileReaders: Promise<any>[] = [];

    files.forEach((file: File) => {
      const reader = new FileReader();
      const readerPromise = new Promise<void>((resolve) => {
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
          resolve();
        };
      });
      reader.readAsDataURL(file);
      fileReaders.push(readerPromise);
    });

    Promise.all(fileReaders).catch(() => {
      console.error("Lỗi khi tải hình ảnh");
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imagePreviews.length === 0) return;

    try {
      setIsSubmitting(true);
      console.log("Starting submit process...");
      
      // Kiểm tra status của page trước khi đăng
      const isPageActive = await checkPageStatus();
      console.log("Is page active:", isPageActive);
      
      if (!isPageActive) {
        console.log("Page is not active, stopping submission");
        return;
      }
      
      // Upload images and get URLs
      const imageUrls = await Promise.all(
        imagePreviews.map((imagePreview) => uploadImage2(imagePreview, post))
      );

      // Create the post with the uploaded image URLs
      const response = await post('/v1/page-post/create', {
        content,
        imageUrls,
        kind: 1, // Public post
        pageId
      });
      
      console.log("Create post response:", response);
      
      if (response.result && response.data) {
        // Kiểm tra status trực tiếp từ response data
        const postStatus = response.data.status;
        console.log("Post status from response:", postStatus);
        
        if (postStatus === 3) {
          // Lấy thông tin chi tiết về lý do từ chối
          const flaggedCategories = response.data.flaggedCategories || [];
         // const moderationDetails = response.data.moderationDetails || {};
          
          let rejectionReason = "Bài đăng của bạn đã bị từ chối do vi phạm nội dung.";
          if (flaggedCategories.length > 0) {
            rejectionReason += ` Các vi phạm: ${flaggedCategories.join(", ")}`;
          }
          
          toast.error(
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} />
                <span className="font-semibold">Bài đăng bị từ chối</span>
              </div>
              <p className="text-sm ml-7">{rejectionReason}</p>
            </div>,
            {
              position: "top-center",
              autoClose: 7000, // Tăng thời gian hiển thị để người dùng đọc kỹ
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              theme: "colored",
              style: {
                background: '#FEE2E2',
                color: '#991B1B',
                fontSize: '14px',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px', // Giới hạn chiều rộng để dễ đọc
              }
            }
          );
        } else {
          toast.success(
            <div className="flex items-center gap-2">
              <CircleCheckBigIcon className="text-green-500" size={20} />
              <span>Đăng bài thành công!</span>
            </div>,
            {
              position: "top-center",
              autoClose: 3000,
              theme: "colored",
              style: {
                background: '#ECFDF5',
                color: '#065F46',
                fontSize: '14px',
                padding: '16px',
                borderRadius: '8px',
              }
            }
          );
        }

        setContent('');
        setImagePreviews([]);
        onPostCreated();
        onClose();
      } else {
        console.error('Failed to create post:', response);
        toast.error(response.message || 'Không thể tạo bài đăng', {
          position: "top-center",
          theme: "colored",
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
          }
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Có lỗi xảy ra khi tạo bài đăng', {
        position: "top-center",
        theme: "colored",
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Render image grid based on number of images
  const renderImageGrid = () => {
    if (imagePreviews.length === 0) {
      return (
        <div className="flex items-center justify-center">
          <ImageIcon className="text-gray-400" size={20} />
          <p className="ml-2 text-gray-400">Thêm hình ảnh</p>
        </div>
      );
    }

    if (imagePreviews.length === 1) {
      // Single image: display at full width
      return (
        <div className="relative group">
          <img
            src={imagePreviews[0]}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => removeImage(0)}
            className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      );
    }

    if (imagePreviews.length === 2) {
      // Two images: display side by side
      return (
        <div className="grid grid-cols-2 gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-52 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (imagePreviews.length === 3) {
      // Three images: one large on left, two stacked on right
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="relative group">
            <img
              src={imagePreviews[0]}
              alt="Preview 1"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeImage(0)}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {imagePreviews.slice(1, 3).map((preview, index) => (
              <div key={index + 1} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 2}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index + 1)}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (imagePreviews.length === 4) {
      // Four images: 2x2 grid
      return (
        <div className="grid grid-cols-2 gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      );
    }

    // More than 4 images: 3x2 grid with counter for additional images
    return (
      <div className="grid grid-cols-3 gap-2">
        {imagePreviews.slice(0, 5).map((preview, index) => (
          <div key={index} className="relative group">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {imagePreviews.length > 5 && (
          <div className="relative group">
            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-lg font-semibold">+{imagePreviews.length - 5}</span>
            </div>
            <button
              type="button"
              onClick={() => removeImage(5)}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Tạo bài đăng mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Image Preview with dynamic grid layout */}
          <div className="border border-gray-300 rounded-lg p-4 mt-4 relative hover:border-blue-500">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {renderImageGrid()}
          </div>

          {/* Show all image thumbnails in a scrollable container */}
          {imagePreviews.length > 0 && (
            <div className="mt-2 flex overflow-x-auto space-x-2 pb-2">
              {imagePreviews.map((preview, index) => (
                <div key={`thumb-${index}`} className="relative flex-shrink-0">
                  <img
                    src={preview}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && imagePreviews.length === 0)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isSubmitting || (!content.trim() && imagePreviews.length === 0)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
              <span>Đăng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePagePost;