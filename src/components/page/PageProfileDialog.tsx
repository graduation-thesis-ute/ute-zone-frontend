import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Bookmark, Loader2, X } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { Page } from '../../models/page/Page';
import { PagePost, PagePostResponse } from '../../models/page/PagePost';
import PagePostCard from './PagePostCard';
import PagePhotos from './PagePhotos';
import PageMembers from './PageMembers';
//import { toast } from 'react-toastify';

interface PageProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
}

const PageProfileDialog: React.FC<PageProfileDialogProps> = ({ isOpen, onClose, pageId }) => {
  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { get } = useFetch();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useRef<HTMLDivElement>(null);

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

  const fetchPagePosts = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      const response = await get(`/v1/page-post/list`, {
        pageId: pageId,
        isPaged: '1',
        page: pageNum.toString(),
        size: '10',
        status: '2'
      });
      const data: PagePostResponse = response.data;
      if (pageNum === 0) {
        setPosts(data.content);
      } else {
        setPosts(prev => [...prev, ...data.content]);
      }
      setTotalPages(data.totalPages);
      setCurrentPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [get, pageId]);

  useEffect(() => {
    if (isOpen) {
      fetchPageDetails();
      fetchPagePosts(0);
    }
  }, [isOpen, pageId, fetchPagePosts]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && currentPage < totalPages - 1 && !isLoadingMore) {
          fetchPagePosts(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (lastPostElementRef.current) {
      observer.current.observe(lastPostElementRef.current);
    }
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [currentPage, totalPages, isLoadingMore, fetchPagePosts]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl p-8 items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600">Đang tải trang...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl p-8 items-center justify-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
          <p className="text-gray-700 mb-6">{error || 'Không tìm thấy trang'}</p>
          <button onClick={onClose} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="relative h-56 bg-gray-200 rounded-t-xl">
          {page.coverUrl ? (
            <img src={page.coverUrl} alt="Page cover" className="w-full h-full object-cover rounded-t-xl" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl" />
          )}
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"><X size={24} /></button>
          <div className="absolute -bottom-16 left-8">
            <div className="w-28 h-28 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
              {page.avatarUrl ? (
                <img src={page.avatarUrl} alt="Page avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-3xl text-gray-500">{page.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Page Info */}
        <div className="pt-20 px-8 pb-6">
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
        {/* Tabs */}
        <div className="px-8">
          <div className="flex space-x-4 mt-2 border-b">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 ${activeTab === 'posts' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Bài đăng
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 ${activeTab === 'about' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Giới thiệu
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 ${activeTab === 'followers' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Người theo dõi
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 ${activeTab === 'members' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Thành viên
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-4 py-2 ${activeTab === 'photos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Ảnh
            </button>
          </div>
        </div>
        {/* Tab Content */}
        <div className="px-8 mt-6 mb-8">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 && !isLoadingMore ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Bài đăng</h2>
                  <p className="text-gray-600">Chưa có bài đăng nào.</p>
                </div>
              ) : (
                <>
                  {posts.map((post, index) => (
                    <div
                      key={post._id}
                      ref={index === posts.length - 1 ? lastPostElementRef : undefined}
                    >
                      <PagePostCard post={post} />
                    </div>
                  ))}
                  {isLoadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  )}
                  {currentPage >= totalPages - 1 && posts.length > 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Đã hiển thị tất cả bài đăng ({totalPages} trang)
                    </div>
                  )}
                </>
              )}
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
          {activeTab === 'followers' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Người theo dõi</h2>
              <p className="text-gray-600">Tính năng này đang được phát triển.</p>
            </div>
          )}
          {activeTab === 'members' && <PageMembers pageId={pageId} />}
          {activeTab === 'photos' && <PagePhotos pageId={pageId} />}
        </div>
      </div>
    </div>
  );
};

export default PageProfileDialog; 