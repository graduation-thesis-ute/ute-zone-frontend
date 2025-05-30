import React, { useState, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';
import { Page } from '../../models/page/Page';
import { PagePost } from '../../models/page/PagePost';

interface PagePhotosProps {
  pageId: string;
}

const PagePhotos: React.FC<PagePhotosProps> = ({ pageId }) => {
  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useFetch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch page details
        const pageResponse = await get(`/v1/page/get/${pageId}`);
        setPage(pageResponse.data);

        // Fetch page posts
        const postsResponse = await get(`/v1/post/list`, {
          pageId,
          isPaged: '1',
          page: '0',
          size: '50'
        });
        setPosts(postsResponse.data.content);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pageId, get]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!page) {
    return <div>Không tìm thấy trang</div>;
  }

  // Collect all images
  const images = [
    // Profile and cover images
    { url: page.avatarUrl, type: 'Ảnh đại diện' },
    { url: page.coverUrl, type: 'Ảnh bìa' },
    // Post images
    ...posts.flatMap(post => 
      post.imageUrls?.map((image: string) => ({
        url: image,
        type: 'Ảnh bài đăng'
      })) || []
    )
  ].filter(img => img.url); // Filter out any null/undefined URLs

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Tất cả ảnh</h2>
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image.url || ''}
              alt={`${image.type} ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {image.type}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có ảnh nào</p>
        </div>
      )}
    </div>
  );
};

export default PagePhotos;