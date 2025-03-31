import React, { useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { uploadImage } from '../../utils/utils';
import { remoteUrl } from '../../types/constant';

interface CreatePageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreatePageForm {
  name: string;
  description: string;
  category: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}

const CreatePageDialog: React.FC<CreatePageDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreatePageForm>({
    name: '',
    description: '',
    category: '',
    avatarUrl: null,
    coverUrl: null,
  });
  const [previewUrls, setPreviewUrls] = useState<{
    avatar: string | null;
    cover: string | null;
  }>({
    avatar: null,
    cover: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { post } = useFetch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'avatar') {
          setAvatarPreview(result);
          setAvatarFile(file);
          setPreviewUrls(prev => ({ ...prev, avatar: result }));
        } else {
          setCoverPreview(result);
          setCoverFile(file);
          setPreviewUrls(prev => ({ ...prev, cover: result }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    }
  };

  const handleRemoveImage = (type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      setAvatarPreview(null);
      setAvatarFile(null);
      setPreviewUrls(prev => ({ ...prev, avatar: null }));
    } else {
      setCoverPreview(null);
      setCoverFile(null);
      setPreviewUrls(prev => ({ ...prev, cover: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let avatarUrl = null;
      let coverUrl = null;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const response = await fetch(`${remoteUrl}/v1/file/upload`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const data = await response.json();
        console.log('Avatar upload response:', data);
        if (data.result && data.data?.filePath) {
          avatarUrl = data.data.filePath;
          console.log('Avatar URL:', avatarUrl);
        } else {
          throw new Error('Failed to get avatar URL');
        }
      }

      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        const response = await fetch(`${remoteUrl}/v1/file/upload`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const data = await response.json();
        console.log('Cover upload response:', data);
        if (data.result && data.data?.filePath) {
          coverUrl = data.data.filePath;
          console.log('Cover URL:', coverUrl);
        } else {
          throw new Error('Failed to get cover URL');
        }
      }

      console.log('Creating page with data:', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        avatarUrl,
        coverUrl,
      });

      const response = await post('/v1/page/create', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        avatarUrl,
        coverUrl,
      });

      console.log('Page creation response:', response);

      if (response.data) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error creating page:', err);
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tạo trang mới</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh bìa
              </label>
              <div className="relative">
                {previewUrls.cover ? (
                  <div className="relative group">
                    <img
                      src={previewUrls.cover}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('cover')}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click để upload</span> hoặc kéo thả
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG hoặc GIF (MAX. 800x400px)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh đại diện
              </label>
              <div className="relative">
                {previewUrls.avatar ? (
                  <div className="relative group">
                    <img
                      src={previewUrls.avatar}
                      alt="Avatar preview"
                      className="w-32 h-32 object-cover rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('avatar')}
                      className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-6 h-6 mb-1 text-gray-400" />
                      <p className="text-xs text-gray-500">Upload</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên trang
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn danh mục</option>
                <option value="education">Giáo dục</option>
                <option value="technology">Công nghệ</option>
                <option value="sports">Thể thao</option>
                <option value="entertainment">Giải trí</option>
                <option value="other">Khác</option>
              </select>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Đang tạo...' : 'Tạo trang'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePageDialog; 