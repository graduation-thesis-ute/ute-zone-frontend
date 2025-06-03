import React, { useState, useEffect } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { Page } from '../../models/page/Page';
import { uploadImage } from '../../types/utils';
import { useLoading } from '../../hooks/useLoading';
import { toast } from 'react-toastify';
interface UpdatePageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  page: Page;
}

interface UpdatePageForm {
  name: string;
  description: string;
  category: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}

const UpdatePageDialog: React.FC<UpdatePageDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  page,
}) => {
  const { put, post } = useFetch();
  //const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(page.avatarUrl ?? null);
  const [coverPreview, setCoverPreview] = useState<string | null>(page.coverUrl ?? null);
  const [formData, setFormData] = useState<UpdatePageForm>({
    name: page.name,
    description: page.description,
    category: page.category,
    avatarUrl: page.avatarUrl ?? null,
    coverUrl: page.coverUrl ?? null,
  });
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    setFormData({
      name: page.name,
      description: page.description,
      category: page.category,
      avatarUrl: page.avatarUrl ?? null,
      coverUrl: page.coverUrl ?? null,
    });
    setAvatarPreview(page.avatarUrl ?? null);
    setCoverPreview(page.coverUrl ?? null);
  }, [page]);

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
      setError(null);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      if (type === 'avatar') {
        setAvatarPreview(previewUrl);
        setAvatarFile(file);
      } else {
        setCoverPreview(previewUrl);
        setCoverFile(file);
      }
    } catch (err) {
      setError('Failed to load image. Please try again.');
      console.error('Image load error:', err);
      toast.error('Có lỗi xảy ra khi tải ảnh');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading();
      setError(null);

      let avatarUrl = formData.avatarUrl;
      let coverUrl = formData.coverUrl;

      // Upload avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, post);
        if (!avatarUrl) {
          throw new Error('Failed to upload avatar');
        }
      }

      // Upload cover if changed
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, post);
        if (!coverUrl) {
          throw new Error('Failed to upload cover');
        }
      }

      const response = await put('/v1/page/update', {
        id: page._id,
        ...formData,
        avatarUrl,
        coverUrl
      });
      
      if (response.result) {
        toast.success('Cập nhật trang thành công!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('Failed to update page. Please try again.');
      console.error('Update page error:', err);
      toast.error('Có lỗi xảy ra khi cập nhật trang');
    } finally {
      hideLoading();
    }
  };

  const handleRemoveImage = (type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      setAvatarPreview(null);
      setAvatarFile(null);
      setFormData(prev => ({ ...prev, avatarUrl: null }));
    } else {
      setCoverPreview(null);
      setCoverFile(null);
      setFormData(prev => ({ ...prev, coverUrl: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cập nhật trang</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh bìa
              </label>
              <div className="relative">
                {coverPreview ? (
                  <div className="relative h-48 rounded-lg overflow-hidden group">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage('cover')}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-600">
                        Click để tải ảnh bìa
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'cover')}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh đại diện
              </label>
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden group">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage('avatar')}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-600">
                        Click để tải ảnh đại diện
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Page Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Tên trang
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Danh mục
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Chọn danh mục</option>
                <option value="Giáo dục">Giáo dục</option>
                <option value="Công nghệ">Công nghệ</option>
                <option value="Thể thao">Thể thao</option>
                <option value="Giải trí">Giải trí</option>
                <option value="Kinh doanh">Kinh doanh</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePageDialog; 