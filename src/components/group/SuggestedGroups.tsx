import React from 'react';
import { Users } from 'lucide-react';

const SuggestedGroups: React.FC = () => {
  // Mock data for suggested groups
  const suggestedGroups = [
    {
      id: 1,
      name: 'Nhóm Học Tập',
      description: 'Chia sẻ kiến thức và học tập cùng nhau',
      memberCount: 150,
    },
    {
      id: 2,
      name: 'Nhóm Thể Thao',
      description: 'Cùng nhau rèn luyện sức khỏe',
      memberCount: 200,
    },
    {
      id: 3,
      name: 'Nhóm Âm Nhạc',
      description: 'Chia sẻ đam mê âm nhạc',
      memberCount: 100,
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Nhóm gợi ý</h3>
      <div className="space-y-4">
        {suggestedGroups.map((group) => (
          <div
            key={group.id}
            className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="text-blue-500" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{group.name}</h4>
              <p className="text-xs text-gray-500 truncate">{group.description}</p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Users size={14} className="mr-1" />
                <span>{group.memberCount} thành viên</span>
              </div>
            </div>
            <button className="text-blue-500 hover:bg-blue-50 text-sm font-medium px-3 py-1 rounded">
              Tham gia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedGroups; 