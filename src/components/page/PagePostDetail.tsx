import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { PagePost } from '../../models/page/PagePost';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { toast } from 'react-toastify';

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  user: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

const PagePostDetail: React.FC = () => {
  const { pageId, postId } = useParams<{ pageId: string; postId: string }>();
  const [post, setPost] = useState<PagePost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { get, post: postRequest } = useFetch();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const response = await get(`/v1/page-post/get/${postId}`);
        setPost(response.data);
        await fetchComments();
      } catch (err) {
        toast.error('Không thể tải bài đăng');
        console.error('Error fetching post:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        setIsLoadingComments(true);
        const response = await get(`/v1/page-post-comment/list`, {
          pagePost: postId,
          isPaged: '0'
        });
        setComments(response.data.content || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, get]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await postRequest('/v1/page-post-comment/create', {
        pagePost: postId,
        content: newComment
      });

      if (response.result) {
        const newCommentData = response.data;
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        toast.success('Đã thêm bình luận');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thêm bình luận');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto w-12 h-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600">Đang tải bài đăng...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white shadow-xl rounded-xl p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
          <p className="text-gray-700 mb-6">Không tìm thấy bài đăng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Page Info Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                {post.page.avatarUrl ? (
                  <img
                    src={post.page.avatarUrl}
                    alt={`${post.page.name} avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                    <span className="text-xl font-semibold text-indigo-600">
                      {post.page.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 truncate">{post.page.name}</h3>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {post.page.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-4">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className={`mt-4 grid gap-2 ${
                post.imageUrls.length === 1 ? 'grid-cols-1' : 
                post.imageUrls.length === 2 ? 'grid-cols-2' :
                post.imageUrls.length === 3 ? 'grid-cols-2' :
                'grid-cols-2'
              }`}>
                {post.imageUrls.length === 1 ? (
                  <img
                    src={post.imageUrls[0]}
                    alt="Post image"
                    className="w-full rounded-lg object-cover"
                    style={{ maxHeight: '500px' }}
                  />
                ) : post.imageUrls.length === 2 ? (
                  post.imageUrls.map((url, index) => (
                    <div key={index} className="aspect-square">
                      <img
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))
                ) : post.imageUrls.length === 3 ? (
                  <>
                    <div className="row-span-2">
                      <img
                        src={post.imageUrls[0]}
                        alt="Post image 1"
                        className="w-full h-full object-cover rounded-lg"
                        style={{ height: '340px' }}
                      />
                    </div>
                    {post.imageUrls.slice(1, 3).map((url, index) => (
                      <div key={index}>
                        <img
                          src={url}
                          alt={`Post image ${index + 2}`}
                          className="w-full h-full object-cover rounded-lg"
                          style={{ height: '169px' }}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  post.imageUrls.slice(0, 4).map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {index === 3 && post.imageUrls!.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white rounded-lg">
                          <span className="text-xl font-semibold">+{post.imageUrls!.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Reactions & Comments Count */}
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                {post.totalReactions > 0 && (
                  <span>{post.totalReactions} lượt thích</span>
                )}
              </div>
              <div className="flex space-x-3">
                <span>{post.totalComments || 0} bình luận</span>
                <span>{post.totalShares || 0} lượt chia sẻ</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-100">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Bình luận ({comments.length})</h3>
              
              {/* Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                  >
                    <Send size={20} />
                    <span>Gửi</span>
                  </button>
                </div>
              </form>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="mx-auto w-12 h-12 text-gray-300" />
                  <p className="mt-2">Chưa có bình luận nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                          {comment.user.avatarUrl ? (
                            <img
                              src={comment.user.avatarUrl}
                              alt={comment.user.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                              <span className="text-sm font-semibold text-indigo-600">
                                {comment.user.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{comment.user.displayName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-800">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagePostDetail; 