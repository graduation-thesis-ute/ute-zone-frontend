import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Loader2, Plus, Search, MessageCircle, Heart, HeartOff, ThumbsUp, Smile } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';
import { useProfile } from '../../types/UserContext';
import { useNavigate } from 'react-router-dom';
import GroupPostDetailDialog from './GroupPostDetailDialog';

interface GroupData {
  _id: string;
  name: string;
  description: string;
  avatarUrl: string;
  coverUrl: string;
  members: number;
  status: number;
  createdAt: string;
}

interface GroupPost {
  _id: string;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  user: {
    _id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  totalReactions: number;
  totalComments: number;
  isLiked?: boolean;
  group?: GroupData;
  status?: number;
}

const CommunityGroupFeed: React.FC = () => {
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPost, setSelectedPost] = useState<GroupPost | null>(null);
  const { get, post } = useFetch();
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement>(null);
  const reactionMenuRef = useRef<HTMLDivElement>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [reactionTypes, setReactionTypes] = useState([
    { type: 'like', icon: Heart, label: 'Thích', color: 'text-red-500' },
    { type: 'love', icon: Smile, label: 'Yêu thích', color: 'text-pink-500' },
    { type: 'haha', icon: Smile, label: 'Cười', color: 'text-yellow-500' },
    { type: 'wow', icon: Smile, label: 'Ngạc nhiên', color: 'text-blue-500' },
    { type: 'sad', icon: Smile, label: 'Buồn', color: 'text-gray-500' },
    { type: 'angry', icon: Smile, label: 'Tức giận', color: 'text-red-500' }
  ]);

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await get('/v1/group-post/list', {
        isPaged: '1',
        page: pageNum.toString(),
        size: '10',
        status: '2' // Only show approved posts
      });

      const data = response.data;
      
      if (pageNum === 0) {
        setPosts(data.content);
      } else {
        setPosts(prev => [...prev, ...data.content]);
      }
      
      setTotalPages(data.totalPages);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      toast.error('Không thể tải bài đăng');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [get]);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && currentPage < totalPages - 1 && !isLoadingMore) {
          fetchPosts(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastPostRef.current) {
      observer.current.observe(lastPostRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [currentPage, totalPages, isLoadingMore, fetchPosts]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    try {
      const endpoint = isCurrentlyLiked ? '/v1/group-post/unlike' : '/v1/group-post/like';
      await post(endpoint, { postId });
      
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            isLiked: !isCurrentlyLiked,
            totalReactions: isCurrentlyLiked ? post.totalReactions - 1 : post.totalReactions + 1
          };
        }
        return post;
      }));

      toast.success(isCurrentlyLiked ? 'Đã bỏ thích bài viết' : 'Đã thích bài viết');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Không thể thực hiện thao tác này');
    }
  };

  const handleViewPostDetail = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  const handlePostClick = (post: GroupPost) => {
    setSelectedPost(post);
  };

  const handlePostUpdated = () => {
    // Refresh posts when a post is updated (liked, commented, etc.)
    fetchPosts(0);
  };

  const handleReactionMenuEnter = () => {
    setShowReactions(true);
  };

  const handleReactionMenuLeave = () => {
    setShowReactions(false);
  };

  const handleToggleLike = (reactionType: string) => {
    // Implement the logic to toggle the like based on the reaction type
    console.log('Toggling like for:', reactionType);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Bài đăng từ các nhóm công khai</h2>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">Chưa có bài đăng nào</p>
          </div>
        ) : (
          <>
            {posts.map((post, index) => (
              <div 
                key={post._id}
                ref={index === posts.length - 1 ? lastPostRef : undefined}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => handlePostClick(post)}
              >
                {/* Post Header */}
                <div className="flex items-center space-x-3 mb-4" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={post.user.avatarUrl || '/default-avatar.png'}
                    alt={post.user.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">{post.user.displayName}</h3>
                    {post.group && (
                      <p className="text-sm text-blue-600">{post.group.name}</p>
                    )}
                    <p className="text-sm text-gray-500">{formatTime(post.createdAt)}</p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="text-gray-800 whitespace-pre-wrap mb-4">
                  {post.content}
                </div>

                {/* Post Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                  <div className={`grid gap-2 mb-4 ${
                    post.imageUrls.length === 1 ? 'grid-cols-1' : 
                    post.imageUrls.length === 2 ? 'grid-cols-2' :
                    post.imageUrls.length === 3 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {post.imageUrls.map((url, index) => (
                      <div key={`${post._id}-image-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="w-full rounded-lg object-cover hover:opacity-90 transition-opacity"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex flex-col mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                  {/* Like and Comment counts */}
                  <div className="flex items-center justify-center space-x-4 text-gray-500 text-sm mb-2">
                    {post.totalReactions > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="bg-blue-500 rounded-full p-1">
                          <ThumbsUp size={10} className="text-white" />
                        </div>
                        <span>{post.totalReactions}</span>
                      </div>
                    )}
                    {post.totalComments > 0 && (
                      <span>{post.totalComments} bình luận</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-center border-t pt-2">
                    <div className="flex justify-between w-full max-w-3xl px-12">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post._id, post.isLiked || false);
                        }}
                        className={`flex items-center justify-center py-2.5 px-12 rounded-md transition-colors ${
                          post.isLiked 
                            ? 'text-blue-600 hover:bg-blue-50' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {post.isLiked ? (
                          <ThumbsUp size={22} className="fill-current" />
                        ) : (
                          <ThumbsUp size={22} />
                        )}
                        <span className="ml-2.5 font-medium text-base">Thích</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(post);
                        }}
                        className="flex items-center justify-center py-2.5 px-12 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <MessageCircle size={22} />
                        <span className="ml-2.5 font-medium text-base">Bình luận</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reaction types popup - similar to Facebook */}
                {showReactions && (
                  <div
                    ref={reactionMenuRef}
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg p-2 flex space-x-1 z-10"
                    onMouseEnter={handleReactionMenuEnter}
                    onMouseLeave={handleReactionMenuLeave}
                    style={{ transform: 'translateY(-8px)' }}
                  >
                    {reactionTypes.map((reaction) => (
                      <div
                        key={reaction.type}
                        className="relative group"
                        onMouseEnter={() => setHoveredReaction(reaction.type)}
                        onMouseLeave={() => setHoveredReaction(null)}
                      >
                        <button
                          className={`p-2 rounded-full hover:bg-gray-100 transform transition-all duration-150 ${
                            hoveredReaction === reaction.type ? 'scale-125' : ''
                          } ${reaction.color}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(reaction.type);
                          }}
                        >
                          {React.createElement(reaction.icon, { size: 24 })}
                        </button>

                        {/* Label tooltip */}
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                          {reaction.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            {currentPage >= totalPages - 1 && posts.length > 0 && (
              <div className="text-center py-4 text-gray-500">
                Đã hiển thị tất cả bài đăng
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Detail Dialog */}
      {selectedPost && (
        <GroupPostDetailDialog
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={{
            id: selectedPost._id,
            content: selectedPost.content,
            imageUrls: selectedPost.imageUrls || [],
            createdAt: selectedPost.createdAt,
            user: {
              _id: selectedPost.user._id,
              displayName: selectedPost.user.displayName,
              avatarUrl: selectedPost.user.avatarUrl || undefined
            },
            status: selectedPost.status ?? 2,
            group: selectedPost.group,
            totalReactions: selectedPost.totalReactions,
            totalComments: selectedPost.totalComments,
            totalShares: 0
          }}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
};

export default CommunityGroupFeed; 