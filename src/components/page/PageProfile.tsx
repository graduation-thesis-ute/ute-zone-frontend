import React, { useState, useEffect } from 'react';
import { Users, Bookmark, Settings, Share2, Bell, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { Page } from '../../models/page/Page';
import { PagePost, PagePostResponse } from '../../models/page/PagePost';
import PagePostCard from './PagePostCard';
import PagePhotos from './PagePhotos';

interface PageProfileProps {
  pageId: string;
  pageData: Page | null;
}

const PageProfile: React.FC<PageProfileProps> = ({ pageId, pageData }) => {
  const [page, setPage] = useState<Page | null>(pageData);
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [isLoading, setIsLoading] = useState(!pageData);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const { get } = useFetch();

  const fetchPageDetails = async () => {
    try {
      setIsLoading(true);
      const response = await get(`/v1/page/get/${pageId}`);
      setPage(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch page details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPagePosts = async () => {
    try {
      const response = await get(`/v1/page/post/list/${pageId}`, {
        isPaged: '1',
        page: '0',
        size: '10'
      });
      const data: PagePostResponse = response.data;
      setPosts(data.content);
    } catch (err) {
      console.error('Failed to fetch page posts:', err);
    }
  };

  useEffect(() => {
    const fetchPageData = async () => {
      if (!pageData) {
        await fetchPageDetails();
        await fetchPagePosts();
      } else {
        setPage(pageData);
      }
    };

    fetchPageData();
  }, [pageId, pageData, get]);

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

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white shadow-xl rounded-xl p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
          <p className="text-gray-700 mb-6">{error || 'Không tìm thấy trang'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Cover Photo */}
      <div className="h-64 bg-gray-200 relative">
        {page.coverUrl ? (
          <img
            src={page.coverUrl}
            alt="Page cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
        )}
        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
            {page.avatarUrl ? (
              <img
                src={page.avatarUrl}
                alt="Page avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-3xl text-gray-500">
                  {page.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Info */}
      <div className="pt-20 px-8 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{page.name}</h1>
            <p className="text-gray-600 mt-1">{page.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users size={16} />
                <span>{page.totalFollowers} người theo dõi</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bookmark size={16} />
                <span>Đã tạo {new Date(page.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Bookmark size={16} />
              <span>{isFollowing ? 'Đã theo dõi' : 'Theo dõi'}</span>
            </button>
            <button
              onClick={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
              className={`p-2 rounded-lg ${
                isNotificationsEnabled
                  ? 'bg-blue-100 text-blue-500'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Bell size={20} />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
              <Share2 size={20} />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Page Tabs */}
        <div className="flex space-x-4 mt-6 border-b">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 ${
              activeTab === 'posts'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bài đăng
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 ${
              activeTab === 'about'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Giới thiệu
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 ${
              activeTab === 'events'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sự kiện
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 ${
              activeTab === 'members'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Thành viên
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 ${
              activeTab === 'photos'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ảnh
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.map((post) => (
                <PagePostCard key={post._id} post={post} />
              ))}
            </div>
          )}
          {activeTab === 'about' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Giới thiệu</h2>
              <p className="text-gray-600">{page.description}</p>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Thông tin</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Thể loại:</span> {page.category}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Ngày tạo:</span>{' '}
                    {new Date(page.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'photos' && (
            <PagePhotos pageId={pageId} />
          )}
          {/* Add other tab contents as needed */}
        </div>
      </div>
    </div>
  );
};

export default PageProfile; 