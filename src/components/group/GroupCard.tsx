import React, { useState } from 'react';
import { Users, Settings, MessageSquare } from 'lucide-react';

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
    onSettingsClick
}) => {
    const [coverError, setCoverError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    const handleCardClick = () => {
        onGroupClick(id);
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn chặn sự kiện click lan ra card
        if (type === 'my') {
            onGroupClick(id);
        } else if (type === 'followed') {
            // Xử lý cho nhóm đã tham gia
            console.log('Đã tham gia nhóm:', id);
        } else {
            // Xử lý cho nhóm cộng đồng
            console.log('Tham gia nhóm:', id);
        }
    };

    return (
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
                    <button 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={(e) => onSettingsClick(e, id)}
                    >
                        <Settings size={20} />
                    </button>
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

                {/* Action Button */}
                <div className="mt-4">
                    <button 
                        onClick={handleActionClick}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                        {type === 'my' ? 'Quản lý' : type === 'followed' ? 'Đã tham gia' : 'Tham gia'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupCard; 