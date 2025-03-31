import React, { useState, useEffect } from 'react';
import { Users, Bookmark, Loader2, Search, Filter } from 'lucide-react';
import { useProfile } from '../../types/UserContext';
import useFetch from '../../hooks/useFetch';

interface FollowedPage {
  _id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  totalFollowers: number;
  category: string;
}

const FollowedPageDetail: React.FC = () => {
  const [followedPages, setFollowedPages] = useState<FollowedPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<FollowedPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const { profile } = useProfile();
  const { get, post } = useFetch();

  const fetchFollowedPages = async () => {
    try {
      setIsLoading(true);
      if (!profile?._id) {
        throw new Error('User ID not found');
      }

      const response = await get('/v1/page-follower/listPageFollowers', {
        user: profile._id,
        page: '0',
        size: '10'
      });
      console.log("response", response);
      
      // Check if response has content
      if (!response.data || !response.data.content) {
        setFollowedPages([]);
        setFilteredPages([]);
        return;
      }
      
      // Wait for all page details to be fetched
      const transformedPages = await Promise.all(
        response.data.content.map(async (item: any) => {
          const pageDetail = await get(`/v1/page/get/${item.page._id}`);
          return {
            _id: pageDetail.data._id,
            name: pageDetail.data.name,
            description: pageDetail.data.description,
            avatarUrl: pageDetail.data.avatarUrl,
            totalFollowers: pageDetail.data.totalFollowers,
            category: pageDetail.data.category
          };
        })
      );
      
      console.log("transformedPages", transformedPages);
      setFollowedPages(transformedPages);
      setFilteredPages(transformedPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch followed pages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?._id) {
      fetchFollowedPages();
    }
  }, [profile?._id]);

  // Search and Filter Logic
  useEffect(() => {
    let result = followedPages;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(page => 
        page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory) {
      result = result.filter(page => page.category === filterCategory);
    }

    setFilteredPages(result);
  }, [searchTerm, filterCategory, followedPages]);

  const handleUnfollow = async (pageId: string) => {
    try {
      await post('/v1/page-follower/follow', { pageId });
      // Refresh followed pages after unfollowing
      fetchFollowedPages();
    } catch (err) {
      console.error('Failed to unfollow page:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto w-12 h-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600">Đang tải trang...</p>
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
            onClick={fetchFollowedPages}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Dynamically generate unique categories
  const uniqueCategories = Array.from(new Set(followedPages.map(page => page.category)))
    .filter(category => category); // Remove empty categories if any

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white shadow-md rounded-lg mb-8">
          <div className="px-6 py-4">
            {/* Top Section with Title */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-extrabold text-gray-900">Trang đã theo dõi</h1>
            </div>

            {/* Search and Filter Section */}
            <div className="flex space-x-4">
              {/* Search Input */}
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm trang..."
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
        {filteredPages.length === 0 && (
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
                ? "Không tìm thấy trang phù hợp" 
                : "Chưa theo dõi trang nào"}
            </h2>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterCategory 
                ? "Thử điều chỉnh tìm kiếm hoặc bộ lọc" 
                : "Bắt đầu theo dõi các trang bạn quan tâm"}
            </p>
          </div>
        )}

        {/* Followed Pages List */}
        <div className="space-y-4">
          {filteredPages.map((page) => (
            <div key={page._id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {page.avatarUrl ? (
                    <img
                      src={page.avatarUrl}
                      alt={`${page.name || 'Page'} avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                        target.parentElement!.innerHTML = `
                          <span class="text-gray-500 text-sm">
                            ${(page.name || 'P').charAt(0).toUpperCase()}
                          </span>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {(page.name || 'P').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{page.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{page.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                      {page.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Users size={12} className="mr-1" />
                      {page.totalFollowers} người theo dõi
                    </span>
                  </div>
                </div>

                {/* Unfollow Button */}
                <button
                  onClick={() => handleUnfollow(page._id)}
                  className="flex-shrink-0 text-red-500 hover:text-red-600 transition-colors"
                >
                  <Bookmark size={20} className="fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowedPageDetail; 