import React from 'react';
import { Users, Globe } from 'lucide-react';

interface GroupListItemProps {
  selectedGroupType: string;
  setSelectedGroupType: (type: string) => void;
}

const GroupListItem: React.FC<GroupListItemProps> = ({
  selectedGroupType,
  setSelectedGroupType,
}) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Groups</h2>
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => setSelectedGroupType("my-groups")}
          className={`flex items-center space-x-2 py-2 px-4 rounded ${
            selectedGroupType === "my-groups"
              ? "bg-blue-500 text-white"
              : "text-gray-500 hover:bg-gray-300"
          }`}
        >
          <Users size={20} />
          <span>Nhóm của tôi</span>
        </button>
        <button
          onClick={() => setSelectedGroupType("community-groups")}
          className={`flex items-center space-x-2 py-2 px-4 rounded ${
            selectedGroupType === "community-groups"
              ? "bg-blue-500 text-white"
              : "text-gray-500 hover:bg-gray-300"
          }`}
        >
          <Globe size={20} />
          <span>Nhóm cộng đồng</span>
        </button>
      </div>
    </div>
  );
};

export default GroupListItem; 