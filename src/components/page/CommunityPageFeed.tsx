import React, { useState } from 'react';
import { Users, Bookmark, Search, Filter } from 'lucide-react';

interface Page {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  avatar?: string;
  memberCount: number;
  followerCount: number;
  category: string;
  isFollowing: boolean;
}

const CommunityPageFeed: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'all',
    'Giáo dục',
    'Công nghệ',
    'Thể thao',
    'Giải trí',
    'Kinh doanh',
    'Khác'
  ];

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Trang cộng đồng</h2>
        
        {/* Search and Filter */}
        <div className="flex space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm trang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>Lọc</span>
          </button>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map((page) => (
          <div key={page._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Cover Image */}
            <div className="h-32 bg-gray-200 relative">
              {page.coverImage && (
                <img
                  src={page.coverImage}
                  alt={`${page.name} cover`}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Avatar */}
              <div className="absolute -bottom-12 left-4">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                  {page.avatar && (
                    <img
                      src={page.avatar}
                      alt={`${page.name} avatar`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Page Info */}
            <div className="pt-14 px-4 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{page.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{page.description}</p>
                  <span className="inline-block mt-1 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">
                    {page.category}
                  </span>
                </div>
                <button
                  className={`${
                    page.isFollowing ? 'text-blue-500' : 'text-gray-500'
                  } hover:text-blue-600`}
                >
                  <Bookmark size={20} />
                </button>
              </div>

              {/* Stats */}
              <div className="flex space-x-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users size={16} />
                  <span>{page.memberCount} thành viên</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bookmark size={16} />
                  <span>{page.followerCount} người theo dõi</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy trang nào</p>
          <p className="text-sm text-gray-400 mt-2">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </p>
        </div>
      )}
    </div>
  );
};

export default CommunityPageFeed; 