import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  X,
  Send,
  Loader2,
  Image as ImageIcon,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Heart,
  Laugh,
  AlertCircle,
  Frown,
  Angry,
  Smile
} from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { uploadImage2 } from '../../types/utils';
import { useProfile } from '../../types/UserContext';

interface Comment {
  _id?: string;
  id?: string;
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
  isReacted: number;
  totalCommentReactions: number;
  replies?: Comment[];
  groupPost?: any;
}

interface GroupPostDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
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
    };
    totalReactions: number;
    totalComments: number;
    totalShares: number;
  };
  onPostUpdated?: () => void;
}

const GroupPostDetailDialog: React.FC<GroupPostDetailDialogProps> = ({
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
 // const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [liked, setLiked] = useState(false);
  //const [isCheckingLike, setIsCheckingLike] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { get, post: postComment } = useFetch();
  //const [totalPages, setTotalPages] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<number | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<number | null>(null);
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactionButtonRef = useRef<HTMLDivElement>(null);
  const reactionMenuRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyPages, setReplyPages] = useState<Record<string, number>>({});
  const [replyHasMore, setReplyHasMore] = useState<Record<string, boolean>>({});
  const [commentReplies, setCommentReplies] = useState<Record<string, Comment[]>>({});

  const reactionTypes = [
    { type: 1, icon: ThumbsUp, label: 'Thích', color: 'text-blue-500' },
    { type: 2, icon: Heart, label: 'Yêu thích', color: 'text-red-500' },
    { type: 3, icon: Laugh, label: 'Haha', color: 'text-yellow-500' },
    { type: 4, icon: AlertCircle, label: 'Wow', color: 'text-purple-500' },
    { type: 5, icon: Frown, label: 'Buồn', color: 'text-gray-500' },
    { type: 6, icon: Angry, label: 'Phẫn nộ', color: 'text-orange-500' },
    { type: 7, icon: Smile, label: 'Thương thương', color: 'text-pink-500' }
  ];

  useEffect(() => {
    if (isOpen) {
      console.log('[DEBUG] Dialog opened - Current state:', {
        replyingTo,
        replyContent,
        replyImagePreview
      });
      console.log('GroupPostDetailDialog opened with post:', post);
      console.log('Post ID in dialog:', post.id);
      setComments([]);
      setCurrentPage(0);
      //setTotalPages(0);
      setReplyingTo(null);
      setReplyContent('');
      setReplyImagePreview(null);
      console.log('[DEBUG] After reset - State should be null:', {
        replyingTo: null,
        replyContent: '',
        replyImagePreview: null
      });
      fetchComments();
      checkIfLiked();
    }
  }, [isOpen]);

  // Handle clicks outside of reaction menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showReactions &&
        reactionMenuRef.current &&
        reactionButtonRef.current &&
        !reactionMenuRef.current.contains(event.target as Node) &&
        !reactionButtonRef.current.contains(event.target as Node)
      ) {
        setShowReactions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactions]);

  const handleShowReactions = () => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
      reactionTimeoutRef.current = null;
    }
    setShowReactions(true);
  };

  const handleHideReactions = () => {
    reactionTimeoutRef.current = setTimeout(() => {
      if (!hoveredReaction) {
        setShowReactions(false);
      }
    }, 300);
  };

  const handleReactionMenuEnter = () => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
      reactionTimeoutRef.current = null;
    }
  };

  const handleReactionMenuLeave = () => {
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactions(false);
      setHoveredReaction(null);
    }, 300);
  };

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for post:', post.id);
      setIsLoading(true);
      const response = await get(`/v1/group-post-comment/list`, {
        groupPost: post.id,
        isPaged: '1',
        page: currentPage.toString(),
        size: '10',
        ignoreChildren: '1'
      });

      const newComments = response.data.content;
      if (currentPage === 0) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }
      setHasMore(currentPage < response.data.totalPages - 1);
     // setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfLiked = async () => {
    try {
      //setIsCheckingLike(true);
      const response = await get(`/v1/group-post-reaction/list`, {
        groupPost: post.id,
        isPaged: '0'
      });

      if (response?.data?.content) {
        const reactions = response.data.content;
        const userReaction = reactions.find((reaction: any) => reaction.user._id === profile?._id);
        if (userReaction) {
          setLiked(true);
          setCurrentReaction(userReaction.reactionType);
        } else {
          setLiked(false);
          setCurrentReaction(null);
        }
      } else {
        setLiked(false);
        setCurrentReaction(null);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
      setLiked(false);
      setCurrentReaction(null);
    } finally {
      //setIsCheckingLike(false);
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

      const response = await postComment('/v1/group-post-comment/create', {
        groupPost: post.id,
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

  const handleToggleLike = async (reactionType?: number) => {
    try {
      if (liked && currentReaction === reactionType) {
        const response = await postComment(`/v1/group-post-reaction/delete/${post.id}`);
        if (response.result) {
          setLiked(false);
          setCurrentReaction(null);
          if (onPostUpdated) {
            onPostUpdated();
          }
        }
        return;
      } else {
        const response = await postComment(`/v1/group-post-reaction/create`, {
          groupPost: post.id,
          reactionType: reactionType || 1
        });
        if (response.result) {
          setLiked(true);
          setCurrentReaction(reactionType || 1);
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
    //setTotalPages(0);
    setSelectedImageIndex(null);
    onClose();
  };

  // Render image gallery with improved layout
  const renderImageGallery = () => {
    if (!post.imageUrls || post.imageUrls.length === 0) return null;

    const handleImageClick = (index: number) => {
      setSelectedImageIndex(index);
    };

    if (post.imageUrls.length === 1) {
      return (
        <div className="mb-3 overflow-hidden">
          <img
            src={post.imageUrls[0]}
            alt="Post image"
            className="w-full rounded-md object-cover cursor-pointer hover:opacity-95 transition-opacity"
            style={{ maxHeight: '500px' }}
            onClick={() => handleImageClick(0)}
          />
        </div>
      );
    }

    if (post.imageUrls.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 mb-3">
          {post.imageUrls.map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-60 object-cover rounded-md cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => handleImageClick(index)}
              />
            </div>
          ))}
        </div>
      );
    }

    if (post.imageUrls.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 mb-3">
          <div className="row-span-2 overflow-hidden">
            <img
              src={post.imageUrls[0]}
              alt="Post image 1"
              className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-95 transition-opacity"
              style={{ height: '340px' }}
              onClick={() => handleImageClick(0)}
            />
          </div>
          {post.imageUrls.slice(1, 3).map((url, index) => (
            <div key={index} className="overflow-hidden">
              <img
                src={url}
                alt={`Post image ${index + 2}`}
                className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-95 transition-opacity"
                style={{ height: '169px' }}
                onClick={() => handleImageClick(index + 1)}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-1 mb-3">
        {post.imageUrls.slice(0, 4).map((url, index) => (
          <div
            key={index}
            className="overflow-hidden relative"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={url}
              alt={`Post image ${index + 1}`}
              className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-95 transition-opacity"
            />
            {index === 3 && post.imageUrls!.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white rounded-md">
                <span className="text-xl font-semibold">+{post.imageUrls!.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Image viewer for selected images
  const renderImageViewer = () => {
    if (selectedImageIndex === null || !post.imageUrls) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <button
          onClick={() => setSelectedImageIndex(null)}
          className="absolute top-4 right-4 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70"
        >
          <X size={24} />
        </button>

        <div className="relative max-w-4xl max-h-[90vh] w-full">
          <img
            src={post.imageUrls[selectedImageIndex]}
            alt={`Full size image ${selectedImageIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain mx-auto"
          />

          {post.imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {post.imageUrls.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${index === selectedImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(index);
                  }}
                />
              ))}
            </div>
          )}

          {selectedImageIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex - 1);
              }}
            >
              &lt;
            </button>
          )}

          {selectedImageIndex < post.imageUrls.length - 1 && (
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex + 1);
              }}
            >
              &gt;
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleReplyClick = (comment: Comment) => {
    // Log để debug
    console.log('Comment object:', comment);
    
    // Lấy ID từ comment, ưu tiên _id trước, nếu không có thì dùng id
    const commentId = comment._id || comment.id;
    console.log('Comment ID:', commentId);
    console.log('Current replyingTo:', replyingTo);

    // Kiểm tra comment có ID không
    if (!comment || !commentId) {
      console.error('Invalid comment object:', comment);
      return;
    }

    // Nếu đang reply comment hiện tại thì đóng form
    if (replyingTo && (replyingTo._id === commentId || replyingTo.id === commentId)) {
      setReplyingTo(null);
      setReplyContent('');
      setReplyImagePreview(null);
      return;
    }

    // Nếu reply comment khác, reset state và set comment mới
    setReplyContent('');
    setReplyImagePreview(null);
    setReplyingTo({
      _id: commentId,  // Sử dụng commentId đã xác định
      id: commentId,   // Giữ lại cả id để tương thích
      content: comment.content,
      user: comment.user,
      createdAt: comment.createdAt,
      imageUrl: comment.imageUrl,
      isOwner: comment.isOwner,
      isUpdated: comment.isUpdated,
      isChildren: comment.isChildren,
      totalChildren: comment.totalChildren,
      parent: comment.parent,
      isReacted: comment.isReacted,
      totalCommentReactions: comment.totalCommentReactions,
      groupPost: comment.groupPost
    });
  };

  // Thêm useEffect để theo dõi thay đổi của replyingTo
  useEffect(() => {
    console.log('[DEBUG] replyingTo state changed:', {
      replyingTo,
      hasReplyingTo: !!replyingTo,
      replyingToId: replyingTo?._id
    });
  }, [replyingTo]);

  const handleReplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || (!replyContent.trim() && !replyImagePreview)) return;

    try {
      setIsSubmittingReply(true);
      let imageUrl = null;

      if (replyImagePreview) {
        imageUrl = await uploadImage2(replyImagePreview, postComment);
      }

      const response = await postComment('/v1/group-post-comment/create', {
        groupPost: post.id,
        content: replyContent,
        imageUrl,
        parent: replyingTo._id
      });

      if (response.result) {
        setReplyContent('');
        setReplyImagePreview(null);
        setReplyingTo(null);
        setComments([]);
        setCurrentPage(0);
        fetchComments();
        if (onPostUpdated) {
          onPostUpdated();
        }
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const fetchReplies = async (commentId: string, page: number = 0) => {
    try {
      const response = await get('/v1/group-post-comment/list', {
        parent: commentId,
        groupPost: post.id,
        page: page.toString(),
        size: '5',
        isPaged: '1'
      });

      const newReplies = response.data.content;
      if (page === 0) {
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: newReplies
        }));
      } else {
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: [...(prev[commentId] || []), ...newReplies]
        }));
      }

      setReplyHasMore(prev => ({
        ...prev,
        [commentId]: page < response.data.totalPages - 1
      }));
      setReplyPages(prev => ({
        ...prev,
        [commentId]: page
      }));
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleToggleReplies = async (comment: Comment) => {
    const commentId = comment._id || comment.id;
    if (!commentId) return;

    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      setExpandedReplies(prev => new Set([...prev, commentId]));
      if (!commentReplies[commentId]) {
        await fetchReplies(commentId);
      }
    }
  };

  const handleLoadMoreReplies = async (comment: Comment) => {
    const commentId = comment._id || comment.id;
    if (!commentId) return;

    const nextPage = (replyPages[commentId] || 0) + 1;
    await fetchReplies(commentId, nextPage);
  };

  const handleCommentReaction = async (comment: Comment) => {
    try {
      const response = await postComment('/v1/group-post-comment/reaction', {
        commentId: comment._id,
        reactionType: 1
      });

      if (response.result) {
        setComments(prev => prev.map(c =>
          c._id === comment._id
            ? {
              ...c,
              isReacted: c.isReacted ? 0 : 1,
              totalCommentReactions: c.isReacted
                ? c.totalCommentReactions - 1
                : c.totalCommentReactions + 1
            }
            : c
        ));
      }
    } catch (error) {
      console.error('Error toggling comment reaction:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
                src={post.user.avatarUrl || '/default-avatar.png'}
                alt={post.user.displayName}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{post.user.displayName}</h3>
                    {post.group && (
                      <p className="text-sm text-blue-600">{post.group.name}</p>
                    )}
                  </div>
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

            {/* Improved image gallery */}
            {renderImageGallery()}

            {/* Like counter */}
            <div className="flex items-center justify-between text-xs text-gray-500 py-2 border-t border-b">
              <div className="flex items-center space-x-1">
                {post.totalReactions > 0 && (
                  <>
                    <div className="flex items-center space-x-1">
                      <div className="bg-blue-500 rounded-full p-1">
                        <ThumbsUp size={10} className="text-white" />
                      </div>
                      <span>{post.totalReactions}</span>
                    </div>
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
              {/* Like button with reaction menu */}
              <div
                ref={reactionButtonRef}
                className="relative flex-1"
              >
                <button
                  className={`flex items-center justify-center space-x-2 py-2 w-full rounded-md hover:bg-gray-100 ${liked ? (currentReaction ? reactionTypes.find(r => r.type === currentReaction)?.color : 'text-blue-500') : 'text-gray-500'
                    }`}
                  onMouseEnter={handleShowReactions}
                  onMouseLeave={handleHideReactions}
                  onClick={() => {
                    if (showReactions) {
                      setShowReactions(false);
                    } else {
                      handleToggleLike(1);
                    }
                  }}
                >
                  {currentReaction ? (
                    React.createElement(reactionTypes.find(r => r.type === currentReaction)?.icon || ThumbsUp, { size: 18 })
                  ) : (
                    <ThumbsUp size={18} />
                  )}
                  <span className="text-sm font-medium">
                    {currentReaction ?
                      reactionTypes.find(r => r.type === currentReaction)?.label || 'Thích' :
                      'Thích'
                    }
                  </span>
                </button>

                {/* Reaction menu that shows on hover */}
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
                          className={`p-2 rounded-full hover:bg-gray-100 transform transition-all duration-150 ${hoveredReaction === reaction.type ? 'scale-125' : ''
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

              {/* Comment button */}
              <button className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 text-gray-500">
                <MessageCircle size={18} />
                <span className="text-sm font-medium">Bình luận</span>
              </button>

              {/* Share button */}
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
            {comments.map((comment: Comment, index: number) => {
              const commentId = comment._id || comment.id;
              if (!commentId) {
                console.error('Comment without ID:', comment);
                return null;
              }
              
              // Log để debug
              console.log('Rendering comment:', commentId);
              
              return (
                <React.Fragment key={`${commentId}-${index}`}>
                  <div className="flex space-x-2">
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
                        <button 
                          className={`text-xs font-medium hover:underline ${comment.isReacted ? 'text-blue-500' : ''}`}
                          onClick={() => handleCommentReaction(comment)}
                        >
                          Thích {comment.totalCommentReactions > 0 && `(${comment.totalCommentReactions})`}
                        </button>
                        <button 
                          className="text-xs font-medium hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Reply button clicked for comment:', comment);
                            handleReplyClick(comment);
                          }}
                        >
                          {replyingTo && (replyingTo._id === commentId || replyingTo.id === commentId) ? 'Hủy phản hồi' : 'Phản hồi'}
                        </button>
                        <p className="text-xs text-gray-500">
                          {formatTime(comment.createdAt)}
                        </p>
                        {comment.isUpdated === 1 && (
                          <span className="text-xs text-gray-400">đã chỉnh sửa</span>
                        )}
                      </div>

                      {/* Reply Input - chỉ hiển thị ngay sau comment được chọn */}
                      {replyingTo && (replyingTo._id === commentId || replyingTo.id === commentId) && (
                        <div className="mt-2 ml-4">
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              console.log('Submitting reply for comment:', commentId);
                              handleSubmitReply(e);
                            }} 
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <img
                                src={profile?.avatarUrl || "/default-avatar.png"}
                                alt="Your avatar"
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1">
                                <input
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={`Phản hồi ${comment.user.displayName}...`}
                                  className="w-full bg-transparent focus:outline-none text-xs"
                                />
                                <div className="flex space-x-2">
                                  {!replyImagePreview && (
                                    <label className="cursor-pointer text-blue-500">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleReplyImageUpload}
                                        className="hidden"
                                      />
                                      <ImageIcon size={16} />
                                    </label>
                                  )}
                                  <button
                                    type="submit"
                                    disabled={isSubmittingReply || (!replyContent.trim() && !replyImagePreview)}
                                    className="text-blue-500 disabled:text-gray-400"
                                  >
                                    {isSubmittingReply ? (
                                      <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                      <Send size={16} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {replyImagePreview && (
                              <div className="relative mt-1 ml-8 inline-block">
                                <img
                                  src={replyImagePreview}
                                  alt="Preview"
                                  className="max-h-24 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => setReplyImagePreview(null)}
                                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded-full"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </form>
                        </div>
                      )}

                      {/* Replies Section - chỉ hiển thị khi có phản hồi */}
                      {comment.totalChildren !== undefined && comment.totalChildren > 0 && (
                        <div className="mt-2 ml-4">
                          <button
                            className="text-xs text-blue-500 hover:underline"
                            onClick={() => handleToggleReplies(comment)}
                          >
                            {expandedReplies.has(commentId) 
                              ? 'Ẩn phản hồi' 
                              : `Xem ${comment.totalChildren} phản hồi${comment.totalChildren === 1 ? '' : ''}`}
                          </button>

                          {expandedReplies.has(commentId) && commentReplies[commentId] && (
                            <div className="mt-2 space-y-2">
                              {commentReplies[commentId].map((reply, replyIndex) => (
                                <div key={`${reply._id}-${replyIndex}`} className="flex space-x-2">
                                  <img
                                    src={reply.user.avatarUrl || '/default-avatar.png'}
                                    alt={reply.user.displayName}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="bg-gray-100 rounded-2xl p-2 inline-block">
                                      <p className="font-semibold text-xs">{reply.user.displayName}</p>
                                      <p className="text-xs">{reply.content}</p>
                                      {reply.imageUrl && (
                                        <img
                                          src={reply.imageUrl}
                                          alt="Reply image"
                                          className="mt-1 rounded-lg max-h-32 object-cover"
                                        />
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1 px-2">
                                      <button
                                        className={`text-xs font-medium hover:underline ${reply.isReacted ? 'text-blue-500' : ''}`}
                                        onClick={() => handleCommentReaction(reply)}
                                      >
                                        Thích {reply.totalCommentReactions > 0 && `(${reply.totalCommentReactions})`}
                                      </button>
                                      {reply.totalChildren !== undefined && reply.totalChildren > 0 && (
                                        <button
                                          className="text-xs text-blue-500 hover:underline"
                                          onClick={() => handleToggleReplies(reply)}
                                        >
                                          {expandedReplies.has(reply._id || '') 
                                            ? 'Ẩn phản hồi' 
                                            : `Xem ${reply.totalChildren} phản hồi${reply.totalChildren === 1 ? '' : ''}`}
                                        </button>
                                      )}
                                      <p className="text-xs text-gray-500">
                                        {formatTime(reply.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {replyHasMore[commentId] && (
                                <button
                                  className="text-xs text-blue-500 hover:underline ml-8"
                                  onClick={() => handleLoadMoreReplies(comment)}
                                >
                                  Xem thêm phản hồi
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
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
                src={profile?.avatarUrl || "/default-avatar.png"}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
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

      {/* Full-screen image viewer */}
      {renderImageViewer()}
    </>
  );
};

export default GroupPostDetailDialog;