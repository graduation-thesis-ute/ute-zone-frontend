import React, { useState } from 'react';
import { X, Image as ImageIcon, Send } from 'lucide-react';
import useFetch from '../../hooks/useFetch';

interface CreatePagePostProps {
  pageId: string;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePagePost: React.FC<CreatePagePostProps> = ({ pageId, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { post } = useFetch();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (i === files.length - 1) {
            setImageUrls(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imageUrls.length === 0) return;

    try {
      setIsSubmitting(true);
      await post('/v1/page-post/create', {
        content,
        imageUrls,
        kind: 1, // Public post
        pageId
      });
      
      setContent('');
      setImageUrls([]);
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
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
          {imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
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
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <ImageIcon size={24} className="text-blue-500" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && imageUrls.length === 0)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isSubmitting || (!content.trim() && imageUrls.length === 0)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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