import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { LoadingDialog } from '../Dialog';

interface Group {
  _id: string;
  name: string;
  description: string;
  members: number;
  avatar: string;
}

const CommunityGroups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { get } = useFetch();

  useEffect(() => {
    fetchCommunityGroups();
  }, []);

  const fetchCommunityGroups = async () => {
    try {
      setIsLoading(true);
      const response = await get('/v1/group/list');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching community groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Nhóm cộng đồng</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => (
          <div key={group._id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Users size={24} className="text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{group.name}</h3>
                <p className="text-gray-500 text-sm">{group.description}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Users size={16} className="mr-1" />
                  <span>{group.members} thành viên</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <LoadingDialog isVisible={isLoading} />
    </div>
  );
};

export default CommunityGroups; 