import React, { useState, useEffect } from 'react';
import { Users, Bookmark, TrendingUp, Loader2 } from 'lucide-react';
import { useProfile } from '../../types/UserContext';
import useFetch from '../../hooks/useFetch';

interface SuggestedPage {
  _id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  totalFollowers: number;
  category: string;
}

const SuggestedPages: React.FC = () => {
  const [suggestedPages, setSuggestedPages] = useState<SuggestedPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const { get, post } = useFetch();

  const fetchSuggestedPages = async () => {
    try {
      setIsLoading(true);
      // Fetch suggested pages
      const suggestedResponse = await get('/v1/page-follower/suggested', {
        page: '0',
        size: '10'
      });

      // Fetch pages where user is a member using the new API endpoint
      const memberResponse = await get('/v1/page-member/list', {
        user: profile?._id,
        page: '0',
        size: '100'
      });

      const memberPageIds = memberResponse.data.content.map((member: any) => member.page._id);
      
      // Filter out pages where user is already a member
      const filteredPages = suggestedResponse.data.content.filter(
        (page: SuggestedPage) => !memberPageIds.includes(page._id)
      );

      setSuggestedPages(filteredPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggested pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (pageId: string) => {
    try {
      await post('/v1/page-follower/follow', { pageId });
      // Refresh suggested pages after following
      fetchSuggestedPages();
    } catch (err) {
      console.error('Failed to follow page:', err);
    }
  };

  useEffect(() => {
    if (profile?._id) {
      fetchSuggestedPages();
    }
  }, [profile?._id]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold">Trang gợi ý</h2>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold">Trang gợi ý</h2>
        </div>
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </div>
    );
  }

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
                {page.avatarUrl ? (
                  <img
                    src={page.avatarUrl}
                    alt={`${page.name} avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      target.parentElement!.innerHTML = `
                        <span class="text-gray-500 text-sm">
                          ${page.name.charAt(0).toUpperCase()}
                        </span>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {page.name.charAt(0).toUpperCase()}
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

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(page._id)}
                className="flex-shrink-0 text-gray-500 hover:text-blue-600 transition-colors"
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