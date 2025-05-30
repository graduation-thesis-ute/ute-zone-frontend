import React, { useState, useEffect } from 'react';
import MyPageDetail from '../components/page/MyPageDetail';
import PageProfile from '../components/page/PageProfile';
import FollowedPageDetail from '../components/page/FollowedPageDetail';
import CommunityPageFeed from '../components/page/CommunityPageFeed';
import SuggestedPages from '../components/page/SuggestedPages';
import CreatePageDialog from '../components/page/CreatePageDialog';
import useFetch from '../hooks/useFetch';

interface PageProps {
  pageId: string;
  setSelectedPageType: (type: string) => void;
}

const Page: React.FC<PageProps> = ({ pageId, setSelectedPageType }) => {
  const [pageData, setPageData] = useState(null);
  const { get } = useFetch();

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        // If pageId is "my-pages", "followed", "community", or "create-page", don't fetch
        if (pageId === "my-pages" || pageId === "followed" || pageId === "community" || pageId === "create-page") {
          setPageData(null);
          return;
        }

        // Fetch page details
        const response = await get(`/v1/page/get/${pageId}`);
        setPageData(response.data);
      } catch (error) {
        console.error('Error fetching page data:', error);
      }
    };

    fetchPageData();
  }, [pageId, get]);

  // If pageId is "my-pages", "followed", or "community", show respective components
  if (pageId === "my-pages" || pageId === "followed" || pageId === "community") {
    return (
      <div className="h-screen flex overflow-hidden">
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {pageId === 'my-pages' && <MyPageDetail setSelectedPageType={setSelectedPageType} />}
          {pageId === 'followed' && <FollowedPageDetail />}
          {pageId === 'community' && <CommunityPageFeed />}
        </div>

        {/* Sidebar - Fixed position */}
        <div className="w-1/3 border-l bg-gray-50 overflow-y-auto fixed-sidebar">
          <SuggestedPages />
        </div>
      </div>
    );
  }

  // If pageId is "create-page", show CreatePage component
  if (pageId === "create-page") {
    return <CreatePageDialog isOpen={true} onClose={() => {}} onSuccess={() => {}} />;
  }

  // Otherwise, show PageProfile for the specific page
  return (
    <div className="h-screen flex overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <PageProfile pageId={pageId} pageData={pageData} />
      </div>
      <div className="w-1/3 border-l bg-gray-50 overflow-y-auto fixed-sidebar">
        <SuggestedPages />
      </div>
    </div>
  );
};

export default Page;