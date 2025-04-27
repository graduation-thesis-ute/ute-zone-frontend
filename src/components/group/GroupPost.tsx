import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Users } from 'lucide-react';
import GroupPostDetailDialog from './GroupPostDetailDialog';

interface GroupPostProps {
    post: {
        _id: string;
        content: string;
        imageUrls: string[];
        createdAt: string;
        user: {
            _id: string;
            displayName: string;
            avatarUrl?: string;
        };
        status?: number;
        group?: {
            _id: string;
            name: string;
            avatarUrl?: string;
        };
    };
}

const GroupPost: React.FC<GroupPostProps> = ({ post }) => {
    const [isDetailVisible, setIsDetailVisible] = useState(false);

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

    const handlePostClick = () => {
        setIsDetailVisible(true);
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow cursor-pointer" onClick={handlePostClick}>
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                            {post.user?.avatarUrl ? (
                                <img 
                                    src={post.user.avatarUrl} 
                                    alt={post.user.displayName || 'User avatar'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <Users className="w-5 h-5 text-gray-500" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {post.user?.displayName || 'Người dùng'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {formatDate(post.createdAt)}
                            </p>
                        </div>
                    </div>
                    <button 
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        onClick={(e) => e.stopPropagation()} // Prevent dialog from opening
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Post Content */}
                <div className="px-4 py-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="mt-2">
                        {post.imageUrls.length === 1 ? (
                            <img
                                src={post.imageUrls[0]}
                                alt="Post image"
                                className="w-full max-h-[500px] object-cover"
                            />
                        ) : (
                            <div className={`grid gap-1 ${
                                post.imageUrls.length === 2 ? 'grid-cols-2' :
                                post.imageUrls.length === 3 ? 'grid-cols-2' :
                                post.imageUrls.length === 4 ? 'grid-cols-2' :
                                'grid-cols-3'
                            }`}>
                                {post.imageUrls.slice(0, 4).map((image, index) => (
                                    <div key={`image-${post._id}-${index}`} className="relative aspect-square">
                                        {index === 3 && post.imageUrls.length > 4 && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                <span className="text-white text-2xl font-bold">+{post.imageUrls.length - 4}</span>
                                            </div>
                                        )}
                                        <img
                                            src={image}
                                            alt={`Post image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Post Stats and Actions - Only show for approved posts */}
                {post.status === 2 && (
                    <>
                        {/* Post Stats */}
                        <div className="px-4 py-2 border-t border-gray-200">
                            <div className="flex items-center justify-between text-gray-500 text-sm">
                                <div className="flex items-center space-x-1">
                                    <ThumbsUp className="w-4 h-4 text-blue-500" />
                                    <span>0</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>0 bình luận</span>
                                    <span>0 lượt chia sẻ</span>
                                </div>
                            </div>
                        </div>

                        {/* Post Actions */}
                        <div className="px-4 py-2 border-t border-gray-200">
                            <div className="grid grid-cols-3">
                                <button 
                                    className="flex items-center justify-center space-x-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    onClick={(e) => e.stopPropagation()} // Prevent dialog from opening
                                >
                                    <ThumbsUp className="w-5 h-5" />
                                    <span>Thích</span>
                                </button>
                                <button 
                                    className="flex items-center justify-center space-x-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    onClick={(e) => e.stopPropagation()} // Prevent dialog from opening
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>Bình luận</span>
                                </button>
                                <button 
                                    className="flex items-center justify-center space-x-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    onClick={(e) => e.stopPropagation()} // Prevent dialog from opening
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span>Chia sẻ</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <GroupPostDetailDialog
                isVisible={isDetailVisible}
                onClose={() => setIsDetailVisible(false)}
                post={{
                    ...post,
                    status: post.status || 1
                }}
            />
        </>
    );
};

export default GroupPost; 