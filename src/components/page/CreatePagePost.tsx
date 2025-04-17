import React, { useState } from 'react';
import { X, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { uploadImage2 } from '../../types/utils';

interface CreatePagePostProps {
  pageId: string;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePagePost: React.FC<CreatePagePostProps> = ({ pageId, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { post } = useFetch();

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
      
      if (response.result) {
        setContent('');
        setImagePreviews([]);
        onPostCreated();
        onClose();
      } else {
        console.error('Failed to create post:', response.message);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

          {/* Image Preview */}
          <div className="border border-gray-300 rounded-lg p-4 mt-4 relative hover:border-blue-500">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 w-full">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
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
              ) : (
                <div className="flex items-center justify-center">
                  <ImageIcon className="text-gray-400" size={20} />
                  <p className="ml-2 text-gray-400">Thêm hình ảnh</p>
                </div>
              )}
            </div>
          </div>

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