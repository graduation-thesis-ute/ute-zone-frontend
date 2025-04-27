import React, { useState } from 'react';
import { X, Users, ThumbsUp, MessageCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

interface GroupPostDetailDialogProps {
    isVisible: boolean;
    onClose: () => void;
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
        status: number;
        group?: {
            _id: string;
            name: string;
            avatarUrl?: string;
        };
    };
}

const GroupPostDetailDialog: React.FC<GroupPostDetailDialogProps> = ({
    isVisible,
    onClose,
    post
}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!isVisible) return null;

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

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? post.imageUrls.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => 
            prev === post.imageUrls.length - 1 ? 0 : prev + 1
        );
    };

    const renderImageGallery = () => {
        if (post.imageUrls.length <= 3) {
            // Existing layout for 1-3 images
            if (post.imageUrls.length === 1) {
                return (
                    <div className="relative h-[500px] rounded-lg overflow-hidden">
                        <img
                            src={post.imageUrls[0]}
                            alt="Post image"
                            className="w-full h-full object-contain bg-gray-100"
                        />
                    </div>
                );
            } else if (post.imageUrls.length === 2) {
                return (
                    <div className="grid grid-cols-2 gap-2 h-[400px]">
                        {post.imageUrls.map((image, index) => (
                            <div key={index} className="relative h-full rounded-lg overflow-hidden">
                                <img
                                    src={image}
                                    alt={`Post image ${index + 1}`}
                                    className="w-full h-full object-cover bg-gray-100"
                                />
                            </div>
                        ))}
                    </div>
                );
            } else {
                return (
                    <div className="grid grid-rows-2 gap-2 h-[500px]">
                        <div className="relative h-[300px] rounded-lg overflow-hidden">
                            <img
                                src={post.imageUrls[0]}
                                alt="Post image 1"
                                className="w-full h-full object-cover bg-gray-100"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 h-[200px]">
                            {post.imageUrls.slice(1).map((image, index) => (
                                <div key={index} className="relative h-full rounded-lg overflow-hidden">
                                    <img
                                        src={image}
                                        alt={`Post image ${index + 2}`}
                                        className="w-full h-full object-cover bg-gray-100"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        // Carousel layout for more than 3 images
        return (
            <div className="relative h-[500px] rounded-lg overflow-hidden">
                <img
                    src={post.imageUrls[currentImageIndex]}
                    alt={`Post image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain bg-gray-100"
                />
                
                {/* Navigation buttons */}
                <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {post.imageUrls.length}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold">Chi tiết bài viết</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                    {/* Post Header */}
                    <div className="p-4 flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                            {post.user?.avatarUrl ? (
                                <img 
                                    src={post.user.avatarUrl} 
                                    alt={post.user.displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <Users className="w-6 h-6 text-gray-500" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{post.user?.displayName}</h3>
                                {post.group && (
                                    <>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-blue-600 font-medium">{post.group.name}</span>
                                    </>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-4 py-2">
                        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Post Images */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className="mt-4 px-4">
                            {renderImageGallery()}
                        </div>
                    )}

                    {/* Post Stats */}
                    {post.status === 2 && (
                        <>
                            <div className="px-4 py-3 border-t">
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
                            <div className="px-4 py-2 border-t">
                                <div className="grid grid-cols-3">
                                    <button className="flex items-center justify-center space-x-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                        <ThumbsUp className="w-5 h-5" />
                                        <span>Thích</span>
                                    </button>
                                    <button className="flex items-center justify-center space-x-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                        <MessageCircle className="w-5 h-5" />
                                        <span>Bình luận</span>
                                    </button>
                                    <button className="flex items-center justify-center space-x-2 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                        <Share2 className="w-5 h-5" />
                                        <span>Chia sẻ</span>
                                    </button>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="p-4 border-t">
                                <div className="text-center text-gray-500">
                                    Chưa có bình luận nào.
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupPostDetailDialog; 