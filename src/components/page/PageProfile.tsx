import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Bookmark, Settings, Share2, Bell, Loader2, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { Page } from '../../models/page/Page';
import { PagePost, PagePostResponse } from '../../models/page/PagePost';
import PagePostCard from './PagePostCard';
import PagePhotos from './PagePhotos';
import CreatePagePost from './CreatePagePost';
import PageSettingsDropdown from './PageSettingsDropdown';
import { useProfile } from '../../types/UserContext';
import { toast } from 'react-toastify';
import UpdatePageDialog from './UpdatePageDialog';
import PageMembers from './PageMembers';
import PageMembersDialog from './PageMembersDialog';

interface PageProfileProps {
  pageId: string;
  pageData: Page | null;
}

const PageProfile: React.FC<PageProfileProps> = ({ pageId, pageData }) => {
  const [page, setPage] = useState<Page | null>(pageData);
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [isLoading, setIsLoading] = useState(!pageData);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isPageMember, setIsPageMember] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { get } = useFetch();
  const { profile } = useProfile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useRef<HTMLDivElement>(null);
  const [isUpdatePageOpen, setIsUpdatePageOpen] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [currentFollowersPage, setCurrentFollowersPage] = useState(0);
  const [totalFollowersPages, setTotalFollowersPages] = useState(0);
  const lastFollowerRef = useRef<HTMLDivElement>(null);
  const followersObserver = useRef<IntersectionObserver | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);

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
        size: '10'
      });
      
      const data: PagePostResponse = response.data;
      
      if (pageNum === 0) {
        console.log("data", data);
        setPosts(data.content);
      } else {
        setPosts(prev => [...prev, ...data.content]);
      }
      
      setTotalPages(data.totalPages);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch page posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [get, pageId]);

  const checkPageMembership = async () => {
    try {
      const response = await get(`/v1/page-member/members/${pageId}`);
      if (!profile || !profile._id) {
        setIsPageMember(false);
        return;
      }
      const members = response.data.content || [];
      const isMember = members.some((member: any) => member.user._id === profile._id);
      setIsPageMember(isMember);
    } catch (err) {
      console.error('Failed to check page membership:', err);
      setIsPageMember(false);
    }
  };

  const fetchFollowers = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 0) {
        setIsLoadingFollowers(true);
      }

      const response = await get('/v1/page-follower/listPageFollowers', {
        page: pageId,
        isPaged: '1',
        pageNumber: pageNum.toString(),
        size: '10'
      });

      const data = response.data;
      
      if (pageNum === 0) {
        setFollowers(data.content);
      } else {
        setFollowers(prev => [...prev, ...data.content]);
      }
      
      setTotalFollowersPages(data.totalPages);
      setCurrentFollowersPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch followers:', err);
    } finally {
      setIsLoadingFollowers(false);
    }
  }, [get, pageId]);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!pageData) {
        await fetchPageDetails();
        await fetchPagePosts(0);
        await checkPageMembership();
      } else {
        setPage(pageData);
      }
    };
    fetchPageData();
  }, [pageId, pageData, fetchPagePosts, profile]);

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

  useEffect(() => {
    if (activeTab === 'followers') {
      fetchFollowers(0);
    }
  }, [activeTab, fetchFollowers]);

  useEffect(() => {
    if (followersObserver.current) followersObserver.current.disconnect();

    followersObserver.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && currentFollowersPage < totalFollowersPages - 1 && !isLoadingFollowers) {
          fetchFollowers(currentFollowersPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastFollowerRef.current) {
      followersObserver.current.observe(lastFollowerRef.current);
    }

    return () => {
      if (followersObserver.current) followersObserver.current.disconnect();
    };
  }, [currentFollowersPage, totalFollowersPages, isLoadingFollowers, fetchFollowers]);

  const handlePostCreated = () => {
    setCurrentPage(0);
    fetchPagePosts(0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdatePage = () => {
    setIsUpdatePageOpen(true);
  };

  const handleUpdatePageSuccess = () => {
    fetchPageDetails();
    setIsUpdatePageOpen(false);
  };

  const handleAddMember = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMembersDialogOpen(true);
    setIsSettingsOpen(false);
  };

  const handleToggleStatus = async () => {
    try {
      const response = await get(`/v1/page/${pageId}/toggle-status`, {
        isPublished: !page?.isPublished
      });

      if (response.result) {
        toast.success(page?.isPublished ? 'Đã ẩn trang' : 'Đã công khai trang');
        fetchPageDetails();
      } else {
        toast.error('Có lỗi xảy ra khi thay đổi trạng thái trang');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thay đổi trạng thái trang');
    }
    setIsSettingsOpen(false);
  };

  const handleDeletePage = async () => {
    const confirmed = await new Promise((resolve) => {
      toast.info(
        <div className="flex flex-col items-center">
          <p className="font-semibold mb-2">Xác nhận xóa trang</p>
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa trang này?</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                toast.dismiss();
                resolve(true);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Xóa
            </button>
            <button
              onClick={() => {
                toast.dismiss();
                resolve(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Hủy
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await get(`/v1/page/${pageId}/delete`);
      if (response.result) {
        toast.success('Đã xóa trang thành công');
        window.location.href = '/pages';
      } else {
        toast.error('Có lỗi xảy ra khi xóa trang');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi xóa trang');
    }
    setIsSettingsOpen(false);
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
          <img src={page.coverUrl} alt="Page cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
        )}
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
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
            {/* <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Bookmark size={16} />
              <span>{isFollowing ? 'Đã theo dõi' : 'Theo dõi'}</span>
            </button> */}
            {isPageMember && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="p-2 rounded-lg bg-blue-300 text-gray-500 hover:bg-blue-600"
              >
                <Plus size={20} />
              </button>
            )}
            <button
              onClick={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
              className={`p-2 rounded-lg ${
                isNotificationsEnabled ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Bell size={20} />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
              <Share2 size={20} />
            </button>
            <div ref={settingsRef} className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <Settings size={20} />
              </button>
              <PageSettingsDropdown
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onUpdate={handleUpdatePage}
                onAddMember={handleAddMember}
                onDelete={handleDeletePage}
                onToggleStatus={handleToggleStatus}
                isPublished={page?.isPublished || false}
              />
            </div>
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
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-2 ${
              activeTab === 'followers'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Người theo dõi
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
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Danh sách người theo dõi</h2>
                <div className="space-y-4">
                  {followers.map((follower, index) => (
                    <div 
                      key={follower._id} 
                      ref={index === followers.length - 1 ? lastFollowerRef : undefined}
                      className="flex items-center space-x-4 p-4 border-b last:border-b-0"
                    >
                      <img
                        src={follower.user?.avatarUrl || '/default-avatar.png'}
                        alt={follower.user?.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-medium">{follower.user?.displayName}</h3>
                        <p className="text-sm text-gray-500">Đã theo dõi từ {new Date(follower.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {isLoadingFollowers && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  )}
                  {currentFollowersPage >= totalFollowersPages - 1 && followers.length > 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Đã hiển thị tất cả người theo dõi ({totalFollowersPages} trang)
                    </div>
                  )}
                  {followers.length === 0 && !isLoadingFollowers && (
                    <div className="text-center py-4 text-gray-500">
                      Chưa có người theo dõi nào.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'members' && <PageMembers pageId={pageId} />}
          {activeTab === 'photos' && <PagePhotos pageId={pageId} />}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePagePost
          pageId={pageId}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Update Page Dialog */}
      {isUpdatePageOpen && page && (
        <UpdatePageDialog
          isOpen={isUpdatePageOpen}
          onClose={() => setIsUpdatePageOpen(false)}
          onSuccess={handleUpdatePageSuccess}
          page={page}
        />
      )}

      {/* Members Dialog */}
      <PageMembersDialog
        isOpen={isMembersDialogOpen}
        onClose={() => setIsMembersDialogOpen(false)}
        pageId={pageId}
      />
    </div>
  );
};

export default PageProfile;