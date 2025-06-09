import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, MessageCircle, MoreHorizontal } from 'lucide-react';
import GroupPostDetailDialog from './GroupPostDetailDialog';

interface GroupPostProps {
    post: {
        id: string;
        content: string;
        imageUrls: string[];
        createdAt: string;
        user: {
            _id: string;
            displayName: string;
            avatarUrl?: string;
        };
        status: number;
        group?: {
            _id: string;
            name: string;
            avatarUrl?: string;
            status?: number;
        };
        totalReactions: number;
        totalComments: number;
        totalShares: number;
    };
    onPostUpdated?: () => void;
}

const GroupPost: React.FC<GroupPostProps> = ({ post, onPostUpdated }) => {
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [isContentExpanded, setIsContentExpanded] = useState(false);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [showReadMore, setShowReadMore] = useState(false);

    useEffect(() => {
        if (contentRef.current) {
            const lineHeight = parseInt(window.getComputedStyle(contentRef.current).lineHeight);
            const height = contentRef.current.scrollHeight;
            const maxHeight = lineHeight * 3; // Show 3 lines by default
            setShowReadMore(height > maxHeight);
        }
    }, [post.content]);

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleOpenDetail = () => {
        console.log('Opening detail dialog with post:', post);
        console.log('Post ID:', post.id);
        setIsDetailVisible(true);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow cursor-pointer" onClick={handleOpenDetail}>
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img
                            src={post.user.avatarUrl || '/default-avatar.png'}
                            alt={post.user.displayName}
                            className="w-10 h-10 rounded-full object-cover border"
                        />
                        <div>
                            <h3 className="font-semibold text-base">{post.user.displayName}</h3>
                            {post.group && (
                                <p className="text-sm text-blue-600">{post.group.name}</p>
                            )}
                            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>
                    <button className="text-gray-500">
                        <MoreHorizontal size={18} />
                    </button>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-4">
                    <div className="relative">
                        <p 
                            ref={contentRef}
                            className={`text-gray-800 text-sm mb-3 whitespace-pre-wrap ${
                                !isContentExpanded && showReadMore ? 'line-clamp-3' : ''
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {post.content}
                        </p>
                        {showReadMore && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsContentExpanded(!isContentExpanded);
                                }}
                                className="text-blue-500 text-sm font-medium hover:underline mb-3"
                            >
                                {isContentExpanded ? 'Thu gọn' : 'Đọc thêm'}
                            </button>
                        )}
                    </div>
                    
                    {/* Image Gallery */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-1 mb-3">
                            {post.imageUrls.slice(0, 4).map((url, index) => (
                                <div key={index} className="overflow-hidden relative">
                                    <img
                                        src={url}
                                        alt={`Post image ${index + 1}`}
                                        className="w-full h-40 object-cover rounded-md"
                                    />
                                    {index === 3 && post.imageUrls!.length > 4 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white rounded-md">
                                            <span className="text-xl font-semibold">+{post.imageUrls!.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 py-2 border-t border-b">
                        <div className="flex items-center space-x-1">
                            {post.totalReactions > 0 && (
                                <div className="flex items-center space-x-1">
                                    <div className="bg-blue-500 rounded-full p-1">
                                        <ThumbsUp size={10} className="text-white" />
                                    </div>
                                    <span>{post.totalReactions}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <span>{post.totalComments || 0} bình luận</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between py-1">
                        <button 
                            className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 text-gray-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Add your like handling logic here if needed
                            }}
                        >
                            <ThumbsUp size={18} />
                            <span className="text-sm font-medium">Thích</span>
                        </button>
                        <button 
                            className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 text-gray-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail();
                            }}
                        >
                            <MessageCircle size={18} />
                            <span className="text-sm font-medium">Bình luận</span>
                        </button>
                    </div>
                </div>
            </div>

            <GroupPostDetailDialog
                isOpen={isDetailVisible}
                onClose={() => setIsDetailVisible(false)}
                post={post}
                onPostUpdated={onPostUpdated}
            />
        </>
    );
};

export default GroupPost; 