import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';
import { uploadImage2 } from '../../types/utils';

interface CreateGroupDialogProps {
    isVisible: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ isVisible, onClose, onGroupCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState(1);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const { post } = useFetch();

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Image = reader.result as string;
            if (type === 'avatar') {
                setAvatarPreview(base64Image);
            } else {
                setCoverPreview(base64Image);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalAvatarUrl = null;
            let finalCoverUrl = null;

            if (avatarPreview) {
                finalAvatarUrl = await uploadImage2(avatarPreview, post);
            }
            if (coverPreview) {
                finalCoverUrl = await uploadImage2(coverPreview, post);
            }

            await post('/v1/group/create', {
                name,
                description,
                privacy,
                avatarUrl: finalAvatarUrl,
                coverUrl: finalCoverUrl
            });
            
            toast.success('Tạo nhóm thành công');
            onGroupCreated();
            onClose();
            // Reset form
            setName('');
            setDescription('');
            setPrivacy(1);
            setAvatarPreview(null);
            setCoverPreview(null);
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('Có lỗi xảy ra khi tạo nhóm');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl mx-4 shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Tạo nhóm mới</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cover Image Upload */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ảnh bìa
                            </label>
                            <div className="relative group">
                                {coverPreview ? (
                                    <div className="relative h-48 rounded-lg overflow-hidden">
                                        <img
                                            src={coverPreview}
                                            alt="Cover preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setCoverPreview(null)}
                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                                        onClick={() => coverInputRef.current?.click()}
                                    >
                                        <div className="text-center">
                                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">
                                                <span className="font-medium">Click để tải ảnh bìa</span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG hoặc GIF</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    accept="image/*"
                                    onChange={(e) => handleImageSelect(e, 'cover')}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Avatar Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ảnh đại diện
                            </label>
                            <div className="relative group">
                                {avatarPreview ? (
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setAvatarPreview(null)}
                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                                        onClick={() => avatarInputRef.current?.click()}
                                    >
                                        <div className="text-center">
                                            <Upload className="w-6 h-6 mx-auto text-gray-400" />
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    accept="image/*"
                                    onChange={(e) => handleImageSelect(e, 'avatar')}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Group Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên nhóm
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    placeholder="Nhập tên nhóm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Nhập mô tả nhóm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quyền riêng tư
                                </label>
                                <select
                                    value={privacy}
                                    onChange={(e) => setPrivacy(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value={1}>Công khai</option>
                                    <option value={2}>Riêng tư</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Đang tạo...' : 'Tạo nhóm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupDialog; 