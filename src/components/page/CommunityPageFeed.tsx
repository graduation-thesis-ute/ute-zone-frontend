import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Search, Filter, ThumbsUp, MessageCircle, Share2, Check } from 'lucide-react';
import { useProfile } from '../../types/UserContext';
import useFetch from '../../hooks/useFetch';
import PostDetailDialog from './PostDetailDialog';
import { PagePost } from '../../models/page/PagePost';
import { toast } from 'react-toastify';
import PageProfileDialog from './PageProfileDialog';

const CommunityPageFeed: React.FC = () => {
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PagePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { profile } = useProfile();
  const { get, post } = useFetch();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement>(null);
  const [selectedPost, setSelectedPost] = useState<PagePost | null>(null);
  const [followedPages, setFollowedPages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const fetchCommunityPosts = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      if (!profile?._id) {
        throw new Error('User ID not found');
      }

      // Fetch community pages (kind = 1)
      const pagesResponse = await get('/v1/page/list', {
        kind: '1',
        isPaged: '0',
      });

      if (!pagesResponse.data || !pagesResponse.data.content) {
        if (pageNum === 0) {
          setPosts([]);
          setFilteredPosts([]);
        }
        return;
      }

      // Get posts from each community page
      const postsPromises = pagesResponse.data.content.map(async (page: any) => {
        const postsResponse = await get('/v1/page-post/list', {
          pageId: page._id,
          isPaged: '1',
          page: '0',
          size: '10'
        });

        if (postsResponse.data && postsResponse.data.content) {
          return postsResponse.data.content;
        }
        return [];
      });

      const allPosts = await Promise.all(postsPromises);
      const flattenedPosts = allPosts.flat().sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (pageNum === 0) {
        setPosts(flattenedPosts);
        setFilteredPosts(flattenedPosts);
      } else {
        setPosts(prev => [...prev, ...flattenedPosts]);
        setFilteredPosts(prev => [...prev, ...flattenedPosts]);
      }

      setTotalPages(pagesResponse.data.totalPages);
      setCurrentPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch community posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [get, profile?._id]);

  useEffect(() => {
    if (profile?._id) {
      fetchCommunityPosts(0);
    }
  }, [profile?._id, fetchCommunityPosts]);

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && currentPage < totalPages - 1 && !isLoadingMore) {
          fetchCommunityPosts(currentPage + 1);
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
  }, [currentPage, totalPages, isLoadingMore, fetchCommunityPosts]);

  // Search and Filter Logic
  useEffect(() => {
    let result = posts;

    if (searchTerm) {
      result = result.filter(post => 
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.page.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      result = result.filter(post => post.page.kind === filterCategory);
    }

    setFilteredPosts(result);
  }, [searchTerm, filterCategory, posts]);

  const handlePostClick = (post: PagePost) => {
    setSelectedPost(post);
  };

  // Update fetchFollowedPages to correctly map the response
  const fetchFollowedPages = useCallback(async () => {
    try {
      const response = await get('/v1/page-follower/listPageFollowers', {
        user: profile?._id
      });
      if (response.data && response.data.content) {
        // Map the response to get page IDs
        const pageIds = response.data.content.map((follower: any) => follower.page._id);
        setFollowedPages(pageIds);
      }
    } catch (err) {
      console.error('Failed to fetch followed pages:', err);
    }
  }, [get, profile?._id]);

  // Update handleFollow function
  const handleFollow = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await post('/v1/page-follower/follow', { pageId: pageId });
      if (response.result) {
        setFollowedPages(prev => [...prev, pageId]);
        toast.success('Đã theo dõi trang');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi theo dõi trang');
    }
  };

  // Update handleUnfollow function
  const handleUnfollow = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await post('/v1/page-follower/follow', { pageId: pageId });
      if (response.result) {
        setFollowedPages(prev => prev.filter(id => id !== pageId));
        toast.success('Đã hủy theo dõi trang');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi hủy theo dõi trang');
    }
  };

  // Call fetchFollowedPages when component mounts
  useEffect(() => {
    if (profile?._id) {
      fetchFollowedPages();
    }
  }, [profile?._id, fetchFollowedPages]);

  // Add handleShare function
  const handleShare = async (post: PagePost, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/pages/${post.page._id}/posts/${post._id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Đã sao chép liên kết chia sẻ');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast.error('Có lỗi xảy ra khi chia sẻ bài đăng');
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white shadow-xl rounded-xl p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => fetchCommunityPosts(0)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Dynamically generate unique categories
  const uniqueCategories = Array.from(new Set(posts.map(post => post.page.category)))
    .filter(category => category);

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white shadow-md rounded-lg mb-8">
          <div className="px-6 py-4">
            {/* Top Section with Title */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-extrabold text-gray-900">Bài đăng cộng đồng</h1>
            </div>

            {/* Search and Filter Section */}
            <div className="flex space-x-4">
              {/* Search Input */}
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm bài đăng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  <option value="">Tất cả danh mục</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Filter 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center bg-white shadow-xl rounded-xl p-12">
            <div className="mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-24 w-24 mx-auto text-gray-300"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              {searchTerm || filterCategory 
                ? "Không tìm thấy bài đăng phù hợp" 
                : "Chưa có bài đăng nào"}
            </h2>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterCategory 
                ? "Thử điều chỉnh tìm kiếm hoặc bộ lọc" 
                : "Hãy quay lại sau"}
            </p>
          </div>
        )}

        {/* Posts List with fixed height and overflow */}
        <div className="space-y-6 h-[calc(100vh-300px)] overflow-y-auto">
          {filteredPosts.map((post, index) => (
            <div 
              key={post._id} 
              ref={index === filteredPosts.length - 1 ? lastPostRef : undefined}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
              onClick={() => handlePostClick(post)}
            >
              {/* Page Info Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm"
                    style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); setSelectedPageId(post.page._id); }}
                  >
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
                      <h3
                        className="font-semibold text-gray-900 truncate cursor-pointer"
                        onClick={e => { e.stopPropagation(); setSelectedPageId(post.page._id); }}
                      >
                        {post.page.name}
                      </h3>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {post.page.category}
                      </span>
                      {followedPages.includes(post.page._id) ? (
                        <button
                          onClick={(e) => handleUnfollow(post.page._id, e)}
                          className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full hover:bg-red-100"
                        >
                          Hủy theo dõi
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleFollow(post.page._id, e)}
                          className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100"
                        >
                          Theo dõi
                        </button>
                      )}
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
                        className="w-full rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        style={{ maxHeight: '500px' }}
                      />
                    ) : post.imageUrls.length === 2 ? (
                      post.imageUrls.map((url, index) => (
                        <div key={index} className="aspect-square">
                          <img
                            src={url}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                          />
                        </div>
                      ))
                    ) : post.imageUrls.length === 3 ? (
                      <>
                        <div className="row-span-2">
                          <img
                            src={post.imageUrls[0]}
                            alt="Post image 1"
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                            style={{ height: '340px' }}
                          />
                        </div>
                        {post.imageUrls.slice(1, 3).map((url, index) => (
                          <div key={index}>
                            <img
                              src={url}
                              alt={`Post image ${index + 2}`}
                              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
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
                            className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
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
              </div>

              {/* Post Actions */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <button 
                    className={`flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 ${
                      post.isLiked ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    <ThumbsUp size={20} />
                    <span className="font-medium">Thích</span>
                  </button>
                  
                  <button className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 text-gray-500">
                    <MessageCircle size={20} />
                    <span className="font-medium">Bình luận</span>
                  </button>
                  
                  <button 
                    onClick={(e) => handleShare(post, e)}
                    className="flex items-center justify-center space-x-2 py-2 flex-1 rounded-md hover:bg-gray-100 text-gray-500"
                  >
                    {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                    <span className="font-medium">Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-6">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Đang tải thêm...</span>
              </div>
            </div>
          )}
          
          {/* No More Posts Indicator */}
          {currentPage >= totalPages - 1 && filteredPosts.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">Đã hiển thị tất cả bài đăng</p>
              <p className="text-xs mt-1">({totalPages} trang)</p>
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Dialog */}
      {selectedPost && (
        <PostDetailDialog
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
          onPostUpdated={() => fetchCommunityPosts(currentPage)}
        />
      )}
      {/* Page Profile Dialog Popup */}
      <PageProfileDialog
        isOpen={!!selectedPageId}
        onClose={() => setSelectedPageId(null)}
        pageId={selectedPageId || ''}
      />
    </div>
  );
};

export default CommunityPageFeed;