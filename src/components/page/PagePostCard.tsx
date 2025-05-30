import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, ThumbsUp } from 'lucide-react';
import { PagePost } from '../../models/page/PagePost';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import PostDetailDialog from './PostDetailDialog';

interface PagePostCardProps {
  post: PagePost;
  onPostUpdated?: () => void;
}

const PagePostCard: React.FC<PagePostCardProps> = ({ post, onPostUpdated }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  const handlePostClick = () => {
    setIsDetailOpen(true);
    console.log("post", post);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Vừa xong';
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch (error) {
      return 'Vừa xong';
    }
  };

  // Dynamic image grid rendering based on number of images
  const renderImageGrid = () => {
    if (!post.imageUrls || post.imageUrls.length === 0) return null;

    if (post.imageUrls.length === 1) {
      // Single image: full width
      return (
        <div className="overflow-hidden">
          <img
            src={post.imageUrls[0]}
            alt="Post image"
            className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            style={{ maxHeight: '500px' }}
            onClick={handlePostClick}
          />
        </div>
      );
    }

    if (post.imageUrls.length === 2) {
      // Two images: side by side
      return (
        <div className="grid grid-cols-2 gap-1">
          {post.imageUrls.map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handlePostClick}
              />
            </div>
          ))}
        </div>
      );
    }

    if (post.imageUrls.length === 3) {
      // Three images: one large on left, two stacked on right
      return (
        <div className="grid grid-cols-2 gap-1">
          <div className="overflow-hidden row-span-2">
            <img
              src={post.imageUrls[0]}
              alt="Post image 1"
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              style={{ height: '320px' }}
              onClick={handlePostClick}
            />
          </div>
          {post.imageUrls.slice(1, 3).map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 2}`}
                className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handlePostClick}
              />
            </div>
          ))}
        </div>
      );
    }

    if (post.imageUrls.length === 4) {
      // Four images: 2x2 grid
      return (
        <div className="grid grid-cols-2 gap-1">
          {post.imageUrls.map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handlePostClick}
              />
            </div>
          ))}
        </div>
      );
    }

    // 5 or more images: Show first 4 with a counter for remaining
    return (
      <div className="grid grid-cols-2 gap-1">
        {post.imageUrls.slice(0, 4).map((url, index) => (
          <div key={index} className={`overflow-hidden relative ${index === 3 && post.imageUrls!.length > 4 ? 'group' : ''}`}>
            <img
              src={url}
              alt={`Post image ${index + 1}`}
              className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={handlePostClick}
            />
            {index === 3 && post.imageUrls!.length > 4 && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                onClick={handlePostClick}
              >
                <span className="text-white text-2xl font-bold">+{post.imageUrls!.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={post.page?.avatarUrl || '/default-avatar.png'}
                  alt={post.page?.name}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                {!post.page?.avatarUrl && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-50" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-gray-900 hover:underline cursor-pointer">
                  {post.page?.name}
                </h3>
                <p className="text-xs text-gray-500 flex items-center space-x-2">
                  <span>{formatTime(post.createdAt)}</span>
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Images - Using the new renderImageGrid function */}
        {renderImageGrid()}

        {/* Interaction counts */}
        <div className="px-4 py-2 flex items-center justify-between border-t border-b mt-3">
          <div className="flex items-center space-x-2">
            {post.totalReactions > 0 && (
              <>
                <div className="bg-blue-500 rounded-full p-1">
                  <ThumbsUp size={12} className="text-white" />
                </div>
                <span className="text-sm text-gray-500">{post.totalReactions}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span>{post.totalComments || 0} bình luận</span>
            <span>{post.totalShares || 0} lượt chia sẻ</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-2 py-1 flex justify-between">
          <button 
            onClick={() => setLiked(!liked)}
            className={`flex items-center justify-center space-x-2 py-2 flex-1 rounded-lg hover:bg-gray-100 transition-colors ${
              liked ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            <ThumbsUp size={20} />
            <span className="font-medium text-sm">Thích</span>
          </button>
          <button 
            onClick={handlePostClick}
            className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <MessageCircle size={20} />
            <span className="font-medium text-sm">Bình luận</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <Share2 size={20} />
            <span className="font-medium text-sm">Chia sẻ</span>
          </button>
        </div>
      </div>

      <PostDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        post={post}
        onPostUpdated={onPostUpdated}
      />
    </>
  );
};

export default PagePostCard;