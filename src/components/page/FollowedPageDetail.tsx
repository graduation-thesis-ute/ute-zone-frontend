import React, { useState } from 'react';
import { Users, Bookmark, Bell } from 'lucide-react';

interface Page {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  avatar?: string;
  memberCount: number;
  followerCount: number;
  isFollowing: boolean;
}

const FollowedPageDetail: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Trang đã follow</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm trang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                </div>
                <div className="flex space-x-2">
                  <button className="text-gray-500 hover:text-gray-700">
                    <Bell size={20} />
                  </button>
                  <button className="text-blue-500 hover:text-blue-600">
                    <Bookmark size={20} />
                  </button>
                </div>
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
          <p className="text-gray-500">Bạn chưa follow trang nào</p>
          <p className="text-sm text-gray-400 mt-2">
            Khám phá các trang cộng đồng để bắt đầu follow
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowedPageDetail; 