import React from 'react';
import { Users } from 'lucide-react';

interface GroupData {
  _id: string;
  name: string;
  description: string;
  avatarUrl: string;
  coverUrl: string;
  members: number;
  status: number;
  createdAt: string;
}

interface FollowedGroupDetailProps {
  group: GroupData;
}

const FollowedGroupDetail: React.FC<FollowedGroupDetailProps> = ({ group }) => {
  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {group.avatarUrl ? (
              <img src={group.avatarUrl} alt={group.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <Users size={32} className="text-blue-500" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-gray-600">{group.description}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Users size={16} className="mr-1" />
              <span>{group.members} thành viên</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowedGroupDetail; 