import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Search, Filter } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { Page, PageResponse } from '../../models/page/Page';
import PageProfileCard from './PageProfileCard';
import CreatePageDialog from './CreatePageDialog';

interface MyPageDetailProps {
  setSelectedPageType: (type: string) => void;
}

const MyPageDetail: React.FC<MyPageDetailProps> = ({ setSelectedPageType }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);

  const { get } = useFetch();

  const fetchMyPages = async () => {
    try {
      setIsLoading(true);
      const response = await get('/v1/page/list', {
        isPaged: '1',
        page: '0',
        size: '10'
      });
      
      const data: PageResponse = response.data;
      const myPages = data.content.filter(page => page.isOwner === 1);
      setPages(myPages);
      setFilteredPages(myPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPages();
  }, []);

  // Search and Filter Logic
  useEffect(() => {
    let result = pages;

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
  }, [searchTerm, filterCategory, pages]);

  const handlePageClick = (pageId: string) => {
    setSelectedPageType(pageId);
  };

  const handleCreatePage = () => {
    setSelectedPageType('create-page');
  };

  const handleSettings = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    setSelectedPageType(`${pageId}/settings`);
  };

  const handleCreatePageSuccess = () => {
    fetchMyPages();
    setIsCreatePageOpen(false);
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
            onClick={fetchMyPages}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Dynamically generate unique categories
  const uniqueCategories = Array.from(new Set(pages.map(page => page.category)))
    .filter(category => category); // Remove empty categories if any

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white shadow-md rounded-lg mb-8">
          <div className="px-6 py-4">
            {/* Top Section with Title and Create Button */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-extrabold text-gray-900">Trang của tôi</h1>
              <button
                onClick={() => setIsCreatePageOpen(true)}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                <Plus size={20} className="stroke-2" />
                <span className="font-medium">Tạo trang mới</span>
              </button>
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
                : "Chưa có trang nào"}
            </h2>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterCategory 
                ? "Thử điều chỉnh tìm kiếm hoặc bộ lọc" 
                : "Bắt đầu bằng việc tạo trang của riêng bạn"}
            </p>
            <button
              onClick={() => setIsCreatePageOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Tạo trang mới
            </button>
          </div>
        )}

        {/* Pages List */}
        <div className="space-y-4">
          {filteredPages.map((page) => (
            <PageProfileCard
              key={page._id}
              page={page}
              onPageClick={handlePageClick}
              onSettingsClick={handleSettings}
            />
          ))}
        </div>
      </div>

      <CreatePageDialog
        isOpen={isCreatePageOpen}
        onClose={() => setIsCreatePageOpen(false)}
        onSuccess={handleCreatePageSuccess}
      />
    </div>
  );
};

export default MyPageDetail;