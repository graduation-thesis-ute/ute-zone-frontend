import React, { useState, useEffect } from 'react';
import { Users, Crown, Shield, User, Settings, Check, X } from 'lucide-react';
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
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<number>(3);
  const { get, put } = useFetch();

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

  const handleUpdateRole = async (pageMemberId: string) => {
    try {
      const response = await put(`/v1/page-member/update-role`, {
        pageMemberId,
        role: editingRole
      });

      if (response.result) {
        toast.success('Đã cập nhật quyền thành công');
        setEditingMemberId(null);
        fetchMembers();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật quyền');
    }
  };

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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6" />
        Thành viên ({members.length})
      </h2>
      <div className="space-y-4">
        {members.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <img
                src={member.user.avatarUrl || '/default-avatar.png'}
                alt={member.user.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{member.user.displayName}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {getRoleIcon(member.role)}
                  <span>{getRoleName(member.role)}</span>
                </div>
              </div>
            </div>
            {member.role !== 1 && (
              <div className="flex items-center space-x-2">
                {editingMemberId === member._id ? (
                  <>
                    <select
                      value={editingRole}
                      onChange={(e) => setEditingRole(Number(e.target.value))}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                    >
                      <option value={2}>Quản trị viên</option>
                      <option value={3}>Biên tập viên</option>
                    </select>
                    <button
                      onClick={() => handleUpdateRole(member._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Xác nhận"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => setEditingMemberId(null)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
                      title="Hủy"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingMemberId(member._id);
                      setEditingRole(member.role);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Cập nhật quyền"
                  >
                    <Settings size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Chưa có thành viên nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageMembers; 