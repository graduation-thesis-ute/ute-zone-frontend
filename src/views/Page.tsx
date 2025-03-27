import React, { useState, useEffect } from 'react';
import MyPageDetail from '../components/page/MyPageDetail';
import PageProfile from '../components/page/PageProfile';
import FollowedPageDetail from '../components/page/FollowedPageDetail';
import CommunityPageFeed from '../components/page/CommunityPageFeed';
import SuggestedPages from '../components/page/SuggestedPages';
import CreatePage from '../components/page/CreatePage';
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
      <div className="h-full flex">
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {pageId === 'my-pages' && <MyPageDetail setSelectedPageType={setSelectedPageType} />}
          {pageId === 'followed' && <FollowedPageDetail />}
          {pageId === 'community' && <CommunityPageFeed />}
        </div>

        {/* Suggested Pages Sidebar */}
        <div className="w-1/3 border-l bg-gray-50 overflow-auto">
          <SuggestedPages />
        </div>
      </div>
    );
  }

  // If pageId is "create-page", show CreatePage component
  if (pageId === "create-page") {
    return <CreatePage setSelectedPageType={setSelectedPageType} />;
  }

  // Otherwise, show PageProfile for the specific page
  return <PageProfile pageId={pageId} pageData={pageData} />;
};

export default Page;