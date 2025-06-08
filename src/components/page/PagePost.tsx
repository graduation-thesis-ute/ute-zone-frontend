import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import useFetch from '../../hooks/useFetch';

interface PagePostProps {
  post: {
    _id: string;
    content: string;
    imageUrls?: string[];
    createdAt: string;
    user: {
      _id: string;
      name: string;
      avatar?: string;
    };
    totalReactions: number;
    totalComments: number;
    isLiked?: boolean;
  };
  onComment: (postId: string) => void;
  onPostUpdated?: () => void;
}

const PagePost: React.FC<PagePostProps> = ({ post, onComment, onPostUpdated }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [totalReactions, setTotalReactions] = useState(post.totalReactions);
  const { post: postRequest } = useFetch();

  const handleLike = async () => {
    try {
      const response = await postRequest(`/v1/page-post/${post._id}/react`);
      if (response.result) {
        setIsLiked(!isLiked);
        setTotalReactions(prev => isLiked ? prev - 1 : prev + 1);
        if (onPostUpdated) {
          onPostUpdated();
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      {/* Post Header */}
      <div className="flex items-center space-x-3 p-4">
        <img
          src={post.user.avatar || '/default-avatar.png'}
          alt={post.user.name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h3 className="font-semibold">{post.user.name}</h3>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-800">{post.content}</p>
      </div>

      {/* Post Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {post.imageUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Post image ${index + 1}`}
              className="w-full h-64 object-cover"
            />
          ))}
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 border-t border-b">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Heart size={16} className={isLiked ? "text-red-500" : "text-gray-500"} />
            <span>{totalReactions} lượt thích</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle size={16} />
            <span>{post.totalComments} bình luận</span>
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg ${
            isLiked ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Heart size={20} className={isLiked ? "fill-current" : ""} />
          <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
        </button>
        <button
          onClick={() => onComment(post._id)}
          className="flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <MessageCircle size={20} />
          <span>Bình luận</span>
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
};

export default PagePost; 