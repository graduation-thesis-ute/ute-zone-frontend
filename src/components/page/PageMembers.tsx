import React, { useState, useEffect } from 'react';
import { Users, Crown, Shield, User } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';

interface PageMember {
  _id: string;
  user: {
    _id: string;
    displayName: string;
    avatarUrl: string;
  };
  role: number;
}

interface PageMembersProps {
  pageId: string;
}

const PageMembers: React.FC<PageMembersProps> = ({ pageId }) => {
  const [members, setMembers] = useState<PageMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useFetch();

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await get(`/v1/page-member/members/${pageId}`);
      setMembers(response.data.content);
    } catch (error) {
      toast.error('Không thể tải danh sách thành viên');
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [pageId]);

  const getRoleIcon = (role: number) => {
    switch (role) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Shield className="w-5 h-5 text-blue-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 1:
        return 'Chủ trang';
      case 2:
        return 'Quản trị viên';
      default:
        return 'Thành viên';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Thành viên ({members.length})
          </h2>
        </div>

        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={member.user.avatarUrl || '/default-avatar.png'}
                    alt={member.user.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getRoleIcon(member.role)}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {member.user.displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getRoleName(member.role)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageMembers; 