import React from 'react';

interface PageFollowersProps {
  pageId: string;
}

const PageFollowers: React.FC<PageFollowersProps> = ({ pageId }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Page Followers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Follower cards will go here */}
      </div>
    </div>
  );
};

export default PageFollowers; 