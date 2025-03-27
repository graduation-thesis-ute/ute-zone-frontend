import React from 'react';

interface PageMembersProps {
  pageId: string;
}

const PageMembers: React.FC<PageMembersProps> = ({ pageId }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Page Members</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Member cards will go here */}
      </div>
    </div>
  );
};

export default PageMembers; 