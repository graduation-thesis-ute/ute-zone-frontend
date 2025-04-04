import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Search, Filter } from 'lucide-react';
import { useProfile } from '../../types/UserContext';
import useFetch from '../../hooks/useFetch';

interface PagePost {
  _id: string;
  content: string;
  images?: string[];
  createdAt: string;
  page: {
    _id: string;
    name: string;
    avatarUrl?: string;
    category: string;
  };
  totalLikes: number;
  totalComments: number;
}

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
  const { get } = useFetch();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement>(null);

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
          return postsResponse.data.content.map((post: any) => ({
            ...post,
            page: {
              _id: page._id,
              name: page.name,
              avatarUrl: page.avatarUrl,
              category: page.category
            }
          }));
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
      result = result.filter(post => post.page.category === filterCategory);
    }

    setFilteredPosts(result);
  }, [searchTerm, filterCategory, posts]);

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
        <div className="space-y-4 h-[calc(100vh-300px)] overflow-y-auto">
          {filteredPosts.map((post, index) => (
            <div 
              key={post._id} 
              ref={index === filteredPosts.length - 1 ? lastPostRef : undefined}
              className="bg-white rounded-lg p-4 shadow-sm"
            >
              {/* Page Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {post.page.avatarUrl ? (
                    <img
                      src={post.page.avatarUrl}
                      alt={`${post.page.name} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {post.page.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{post.page.name}</h3>
                  <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                    {post.page.category}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {post.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Post Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                <span>{post.totalLikes} lượt thích</span>
                <span>{post.totalComments} bình luận</span>
              </div>
            </div>
          ))}
          
          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          )}
          
          {/* No More Posts Indicator */}
          {currentPage >= totalPages - 1 && filteredPosts.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              Đã hiển thị tất cả bài đăng ({totalPages} trang)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPageFeed; 