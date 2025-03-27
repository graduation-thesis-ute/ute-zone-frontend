import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { PagePost } from '../../models/page/PagePost';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PagePostCardProps {
  post: PagePost;
}

const PagePostCard: React.FC<PagePostCardProps> = ({ post }) => {
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
        <div className="mt-4">
          <img
            src={post.imageUrls[0]}
            alt="Post content"
            className="w-full max-h-96 object-cover"
          />
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