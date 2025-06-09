import React, { useState, useRef, useEffect } from 'react';
import { Users, Settings, MessageSquare, Edit, Trash2, AlertTriangle } from 'lucide-react';
import UpdateGroupDialog from './UpdateGroupDialog';

interface GroupCardProps {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    postCount: number;
    type: 'my' | 'followed' | 'community';
    coverImage?: string;
    avatar?: string;
    onGroupClick: (groupId: string) => void;
    onSettingsClick: (e: React.MouseEvent, groupId: string) => void;
    onEditClick?: (groupId: string) => void;
    onDeleteClick?: (groupId: string) => void;
    onGroupUpdated?: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({
    id,
    name,
    description,
    memberCount,
    postCount,
    type,
    coverImage,
    avatar,
    onGroupClick,
    onSettingsClick,
    onEditClick,
    onDeleteClick,
    onGroupUpdated
}) => {
    const [coverError, setCoverError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [isUpdateDialogVisible, setIsUpdateDialogVisible] = useState(false);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);

    const handleCardClick = () => {
        onGroupClick(id);
    };

    const handleSettingsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowSettingsMenu(!showSettingsMenu);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowSettingsMenu(false);
        setIsUpdateDialogVisible(true);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowSettingsMenu(false);
        setIsDeleteDialogVisible(true);
    };

    const handleGroupUpdated = () => {
        setIsUpdateDialogVisible(false);
        if (onGroupUpdated) {
            onGroupUpdated();
        }
    };

    const handleConfirmDelete = async () => {
        if (onDeleteClick) {
            await onDeleteClick(id);
            if (onGroupUpdated) {
                onGroupUpdated();
            }
        }
        setIsDeleteDialogVisible(false);
    };

    // Close settings menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setShowSettingsMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <div 
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={handleCardClick}
            >
                {/* Cover Image */}
                <div className="h-32 bg-gray-200 relative">
                    {coverImage && !coverError ? (
                        <img
                            src={coverImage}
                            alt={`${name} cover`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => setCoverError(true)}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    )}
                    {/* Avatar */}
                    <div className="absolute -bottom-12 left-4">
                        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                            {avatar && !avatarError ? (
                                <img
                                    src={avatar}
                                    alt={`${name} avatar`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <Users className="w-12 h-12 text-gray-500" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Group Info */}
                <div className="pt-14 px-4 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold">{name}</h3>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{description}</p>
                        </div>
                        {type === 'my' && (
                            <div className="relative" ref={settingsMenuRef}>
                                <button 
                                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                                    onClick={handleSettingsClick}
                                >
                                    <Settings size={20} />
                                </button>
                                {showSettingsMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                        <button
                                            onClick={handleEditClick}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Chỉnh sửa nhóm
                                        </button>
                                        <button
                                            onClick={handleDeleteClick}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xóa nhóm
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex space-x-4 mt-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                            <Users size={16} />
                            <span>{memberCount} thành viên</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <MessageSquare size={16} />
                            <span>{postCount} bài viết</span>
                        </div>
                    </div>

                    {/* Action Button - Only show for non-my groups */}
                    {type !== 'my' && (
                        <div className="mt-4">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onGroupClick(id);
                                }}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                            >
                                {type === 'followed' ? 'Đã tham gia' : 'Tham gia'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <UpdateGroupDialog
                isVisible={isUpdateDialogVisible}
                onClose={() => setIsUpdateDialogVisible(false)}
                onGroupUpdated={handleGroupUpdated}
                group={{
                    _id: id,
                    name,
                    description,
                    members: memberCount,
                    postCount,
                    coverUrl: coverImage,
                    avatarUrl: avatar,
                    privacy: 1
                }}
            />

            {/* Delete Confirmation Dialog */}
            {isDeleteDialogVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-center mb-4">
                            <AlertTriangle className="w-12 h-12 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-center mb-2">Xác nhận xóa nhóm</h3>
                        <p className="text-gray-600 text-center mb-6">
                            Bạn có chắc chắn muốn xóa nhóm "{name}"? Hành động này sẽ chuyển nhóm về trạng thái hoạt động.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setIsDeleteDialogVisible(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GroupCard; 