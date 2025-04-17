import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PagePost } from '../../models/page/PagePost';
import useFetch from '../../hooks/useFetch';
import { useProfile } from '../../types/UserContext';
import { 
  X, 
  Send, 
  Loader2, 
  Image as ImageIcon, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  MoreHorizontal 
} from 'lucide-react';
import { uploadImage2 } from '../../types/utils';

interface PostDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  post: PagePost;
  onPostUpdated?: () => void;
}

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  imageUrl?: string;
  isOwner: number;
  isUpdated: number;
  isChildren: number;
  totalChildren?: number;
  parent?: {
    _id: string;
  };
}

const PostDetailDialog: React.FC<PostDetailDialogProps> = ({
  isOpen,
  onClose,
  post,
  onPostUpdated
}) => {
  const { profile } = useProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isCheckingLike, setIsCheckingLike] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { get, post: postComment } = useFetch();
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      checkIfLiked();
    }
  }, [isOpen, currentPage]);

  const fetchComments = async () => {
    console.log("post test", post);
    console.log("post test total commnet", post.totalComments);
    try {
      setIsLoading(true);
      const response = await get(`/v1/page-post-comment/list`, {
        pagePost: post._id,
        isPaged: '1',
        page: currentPage.toString(),
        size: '10',
        ignoreChildren: '1'
      });
      
      const newComments = response.data.content;
      setComments(prev => [...prev, ...newComments]);
      setHasMore(currentPage < response.data.totalPages - 1);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfLiked = async () => {
    try {
      setIsCheckingLike(true);
      const response = await get(`/v1/page-post-reaction/list`, {
        pagePost: post._id,
        isPaged: '0'
      });
      
      const reactions = response.data.content;
      const hasLiked = reactions.some((reaction: any) => reaction.user._id === profile?._id);
      setLiked(hasLiked);
    } catch (error) {
      console.error('Error checking like status:', error);
    } finally {
      setIsCheckingLike(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !imagePreview) return;

    try {
      setIsSubmitting(true);
      let imageUrl = null;

      if (imagePreview) {
        imageUrl = await uploadImage2(imagePreview, postComment);
      }

      const response = await postComment('/v1/page-post-comment/create', {
        pagePost: post._id,
        content: newComment,
        imageUrl
      });

      if (response.result) {
        setNewComment('');
        setImagePreview(null);
        setComments([]);
        setCurrentPage(0);
        fetchComments();
        if (onPostUpdated) {
          onPostUpdated();
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleToggleLike = async () => {
    try {
      if (liked) {
        // Remove like
        const response = await postComment(`/v1/page-post-reaction/delete/${post._id}`);
        if (response.result) {
          setLiked(false);
          if (onPostUpdated) {
            onPostUpdated();
          }
        }
      } else {
        // Add like
        const response = await postComment(`/v1/page-post-reaction/create`, {
          pagePost: post._id,
          reactionType: 1
        });
        if (response.result) {
          setLiked(true);
          if (onPostUpdated) {
            onPostUpdated();
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return 'Vừa xong';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Vừa xong';
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Vừa xong';
    }
  };

  const handleClose = () => {
    setComments([]);
    setCurrentPage(0);
    setTotalPages(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-center relative">
          <h2 className="text-xl font-semibold text-center w-full">Bài viết</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full absolute right-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Post Content */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={post.page.avatarUrl || '/default-avatar.png'}
              alt={post.page.name}
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">{post.page.name}</h3>
                <button className="text-gray-500">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {formatTime(post.createdAt)}
              </p>
            </div>
          </div>
          
          <p className="text-gray-800 text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
          
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className={`grid gap-1 mb-3 ${
              post.imageUrls.length === 1 ? 'grid-cols-1' :
              post.imageUrls.length === 2 ? 'grid-cols-2' :
              post.imageUrls.length === 3 ? 'grid-cols-2' : 
              post.imageUrls.length === 4 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {post.imageUrls.map((url, index) => {
                const imageUrls = post.imageUrls || [];
                return (
                  <div key={index} className={`relative ${
                    imageUrls.length === 3 && index === 0 ? 'col-span-2 row-span-2' :
                    imageUrls.length === 4 && index === 0 ? 'col-span-2' : ''
                  }`}>
                    <img
                      src={url}
                      alt={`Post image ${index + 1}`}
                      className={`w-full h-full object-cover rounded-md ${
                        imageUrls.length === 1 ? 'max-h-[500px]' :
                        imageUrls.length === 2 ? 'h-[300px]' :
                        imageUrls.length === 3 && index === 0 ? 'h-[400px]' :
                        imageUrls.length === 3 ? 'h-[200px]' :
                        imageUrls.length === 4 ? 'h-[200px]' :
                        'h-[200px]'
                      }`}
                    />
                    {imageUrls.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                        <span className="text-white text-2xl font-bold">+{imageUrls.length - 3}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Like counter */}
          <div className="flex items-center justify-between text-xs text-gray-500 py-2 border-t border-b">
            <div className="flex items-center space-x-1">
              {post.totalReactions > 0 && (
                <>
                  <div className="bg-blue-500 rounded-full p-1">
                    <ThumbsUp size={10} className="text-white" />
                  </div>
                  <span>{post.totalReactions}</span>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <span>{post.totalComments || 0} bình luận</span>
              <span>{post.totalShares || 0} lượt chia sẻ</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between py-1">
            <button 
              className={`flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 ${liked ? 'text-blue-500' : 'text-gray-500'}`}
              onClick={handleToggleLike}
            >
              <ThumbsUp size={18} />
              <span className="text-sm font-medium">Thích</span>
            </button>
            <button className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 text-gray-500">
              <MessageCircle size={18} />
              <span className="text-sm font-medium">Bình luận</span>
            </button>
            <button className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 text-gray-500">
              <Share2 size={18} />
              <span className="text-sm font-medium">Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div 
          className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50"
          onScroll={handleScroll}
        >
          {comments.map(comment => (
            <div key={comment._id} className="flex space-x-2">
              <img
                src={comment.user.avatarUrl || '/default-avatar.png'}
                alt={comment.user.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl p-3 inline-block">
                  <p className="font-semibold text-sm">{comment.user.displayName}</p>
                  <p className="text-sm">{comment.content}</p>
                  {comment.imageUrl && (
                    <img 
                      src={comment.imageUrl} 
                      alt="Comment image" 
                      className="mt-2 rounded-lg max-h-48 object-cover"
                    />
                  )}
                </div>
                <div className="flex items-center space-x-3 mt-1 px-2">
                  <button className="text-xs font-medium hover:underline">Thích</button>
                  <button className="text-xs font-medium hover:underline">Phản hồi</button>
                  <p className="text-xs text-gray-500">
                    {formatTime(comment.createdAt)}
                  </p>
                  {comment.isUpdated === 1 && (
                    <span className="text-xs text-gray-400">đã chỉnh sửa</span>
                  )}
                </div>
                {comment.totalChildren && comment.totalChildren > 0 && (
                  <button className="text-xs text-blue-500 ml-2 mt-1 flex items-center space-x-1">
                    <div className="w-5 h-0.5 bg-gray-300"></div>
                    <span>{comment.totalChildren} phản hồi</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="p-3 border-t bg-white">
          <div className="flex items-center space-x-2">
            <img
              src="/default-avatar.png" // Replace with current user avatar
              alt="Your avatar"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="w-full bg-transparent focus:outline-none text-sm"
              />
              <div className="flex space-x-2">
                {!imagePreview && (
                  <label className="cursor-pointer text-blue-500">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <ImageIcon size={20} />
                  </label>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || (!newComment.trim() && !imagePreview)}
                  className="text-blue-500 disabled:text-gray-400"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {imagePreview && (
            <div className="relative mt-2 ml-10 inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PostDetailDialog;