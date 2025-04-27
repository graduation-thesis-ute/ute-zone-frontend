import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';
import { uploadImage2 } from '../../types/utils';

interface CreateGroupPostDialogProps {
    isVisible: boolean;
    onClose: () => void;
    onPostCreated: () => void;
    groupId: string;
}

const CreateGroupPostDialog: React.FC<CreateGroupPostDialogProps> = ({
    isVisible,
    onClose,
    onPostCreated,
    groupId
}) => {
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { post } = useFetch();

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPreviews: string[] = [];
        setIsLoading(true);

        try {
            // First, create all previews
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                
                const base64Image = await new Promise<string>((resolve) => {
                    reader.onload = (e) => {
                        if (e.target?.result) {
                            resolve(e.target.result as string);
                        }
                    };
                    reader.readAsDataURL(file);
                });

                newPreviews.push(base64Image);
            }

            setImagePreviews([...imagePreviews, ...newPreviews]);

            // Then upload all images sequentially
            const uploadPromises = newPreviews.map(preview => uploadImage2(preview, post));
            const uploadedUrls = await Promise.all(uploadPromises);
            
            const validUrls = uploadedUrls.filter(url => url !== null) as string[];
            setImages([...images, ...validUrls]);

            if (validUrls.length !== newPreviews.length) {
                toast.warning('Một số ảnh không thể tải lên');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Có lỗi xảy ra khi tải lên ảnh');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung bài viết');
            return;
        }

        if (isLoading) {
            toast.error('Vui lòng đợi ảnh tải lên xong');
            return;
        }

        try {
            setIsLoading(true);
            await post('/v1/group-post/create', {
                groupId,
                content,
                imageUrls: images
            });
            
            toast.success('Đã đăng bài viết thành công');
            setContent('');
            setImages([]);
            setImagePreviews([]);
            onPostCreated();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error('Có lỗi xảy ra khi đăng bài');
        } finally {
            setIsLoading(false);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        const newPreviews = [...imagePreviews];
        newImages.splice(index, 1);
        newPreviews.splice(index, 1);
        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Tạo bài viết mới</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Bạn đang nghĩ gì?"
                        className="w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {imagePreviews.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex justify-between">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            <ImageIcon className="w-5 h-5 mr-2" />
                            Thêm ảnh
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isLoading ? 'Đang đăng...' : 'Đăng bài'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupPostDialog; 