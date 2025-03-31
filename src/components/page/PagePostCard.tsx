import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { PagePost } from '../../models/page/PagePost';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PagePostCardProps {
  post: PagePost;
}

const PagePostCard: React.FC<PagePostCardProps> = ({ post }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : (post.imageUrls?.length || 1) - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex < ((post.imageUrls?.length || 1) - 1) ? prevIndex + 1 : 0
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center space-x-3 p-4">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          {post.user.avatarUrl ? (
            <img
              src={post.user.avatarUrl}
              alt={post.user.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="text-lg text-gray-500">
                {post.user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{post.user.displayName}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: vi
              })}
            </span>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4">
        <p className="text-gray-800">{post.content}</p>
      </div>

      {/* Post Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="relative mt-4">
          {/* Main Image */}
          <img
            src={post.imageUrls[currentImageIndex]}
            alt={`Post image ${currentImageIndex + 1}`}
            className="w-full max-h-96 object-cover"
          />

          {/* Image Navigation for Multiple Images */}
          {post.imageUrls.length > 1 && (
            <>
              {/* Previous Image Button */}
              <button 
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Next Image Button */}
              <button 
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <ChevronRight size={24} />
              </button>

              {/* Image Count Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {post.imageUrls.length}
              </div>
            </>
          )}

          {/* Thumbnail Preview for Multiple Images */}
          {post.imageUrls.length > 1 && (
            <div className="flex justify-center space-x-2 mt-2 px-4 py-2">
              {post.imageUrls.map((url, index) => (
                <div 
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-12 h-12 rounded-md overflow-hidden cursor-pointer border-2 ${
                    index === currentImageIndex 
                      ? 'border-blue-500' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 border-t border-b">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Heart size={16} className="text-red-500" />
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle size={16} />
            <span>{post.comments} bình luận</span>
          </div>
          <div className="flex items-center space-x-1">
            <Share2 size={16} />
            <span>{post.shares} chia sẻ</span>
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <Heart size={20} />
          <span>Thích</span>
        </button>
        <button className="flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <MessageCircle size={20} />
          <span>Bình luận</span>
        </button>
        <button className="flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <Share2 size={20} />
          <span>Chia sẻ</span>
        </button>
      </div>
    </div>
  );
};

export default PagePostCard;