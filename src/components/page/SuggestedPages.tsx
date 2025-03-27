import React, { useState } from 'react';
import { Users, Bookmark, TrendingUp } from 'lucide-react';

interface SuggestedPage {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  followerCount: number;
  category: string;
  isFollowing: boolean;
}

const SuggestedPages: React.FC = () => {
  const [suggestedPages, setSuggestedPages] = useState<SuggestedPage[]>([]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold">Trang gợi ý</h2>
      </div>

      {/* Suggested Pages List */}
      <div className="space-y-4">
        {suggestedPages.map((page) => (
          <div key={page._id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {page.avatar && (
                  <img
                    src={page.avatar}
                    alt={`${page.name} avatar`}
                    className="w-full h-full object-cover"
                  />
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
                  <span className="text-xs text-gray-500">
                    {page.followerCount} người theo dõi
                  </span>
                </div>
              </div>

              {/* Follow Button */}
              <button
                className={`flex-shrink-0 ${
                  page.isFollowing ? 'text-blue-500' : 'text-gray-500'
                } hover:text-blue-600`}
              >
                <Bookmark size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {suggestedPages.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">Không có trang gợi ý</p>
        </div>
      )}
    </div>
  );
};

export default SuggestedPages; 