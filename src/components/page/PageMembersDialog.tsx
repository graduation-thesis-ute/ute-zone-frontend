import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, UserPlus, UserMinus, Crown, Shield, Edit3, Settings, Check } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';

interface PageMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
}

interface User {
  _id: string;
  displayName: string;
  avatarUrl?: string;
  email: string;
}

interface PageMember {
  _id: string;
  user: User;
  role: number;
}

const getRoleIcon = (role: number) => {
  switch (role) {
    case 1:
      return <div title="Chủ sở hữu"><Crown className="w-4 h-4 text-yellow-500" /></div>;
    case 2:
      return <div title="Quản trị viên"><Shield className="w-4 h-4 text-blue-500" /></div>;
    case 3:
      return <div title="Biên tập viên"><Edit3 className="w-4 h-4 text-green-500" /></div>;
    default:
      return null;
  }
};

const getRoleName = (role: number) => {
  switch (role) {
    case 1:
      return 'Chủ sở hữu';
    case 2:
      return 'Quản trị viên';
    case 3:
      return 'Biên tập viên';
    default:
      return '';
  }
};

const PageMembersDialog: React.FC<PageMembersDialogProps> = ({
  isOpen,
  onClose,
  pageId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<PageMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<number>(3); // Mặc định là editor
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<number>(3);
  const { get, post, del, put } = useFetch();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, membersResponse] = await Promise.all([
        get('/v1/user/list'),
        get('/v1/page-member/list', { page: pageId })
      ]);

      setUsers(usersResponse.data.content);
      console.log("users", usersResponse.data.content);
      console.log("members", membersResponse.data.content);
      setMembers(membersResponse.data.content);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, pageId]);

  const handleAddMember = async (userId: string) => {
    try {
      const response = await post('/v1/page-member/add', {
        page: pageId,
        user: userId,
        role: selectedRole
      });

      if (response.result) {
        toast.success('Đã thêm thành viên thành công');
        setSelectedUserId(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm thành viên');
    }
  };

  const handleRemoveMember = async (pageMemberId: string) => {
    try {
      const response = await del(`/v1/page-member/remove/${pageMemberId}`);

      if (response.result) {
        toast.success('Đã xóa thành viên thành công');
        fetchData();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa thành viên');
    }
  };

  const handleUpdateRole = async (pageMemberId: string) => {
    try {
      const response = await put(`/v1/page-member/${pageMemberId}`, {
        role: editingRole
      });

      if (response.result) {
        toast.success('Đã cập nhật quyền thành công');
        setEditingMemberId(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật quyền');
    }
  };

  // Lọc ra những người dùng chưa là thành viên
  const nonMembers = users.filter(user => 
    !members.some(member => member.user._id === user._id)
  );

  const filteredNonMembers = nonMembers.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(member =>
    member.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quản lý thành viên</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm thành viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Non-members List */}
              <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Người dùng chưa là thành viên</h3>
                <div className="space-y-2">
                  {filteredNonMembers.map(user => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatarUrl || '/default-avatar.png'}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {selectedUserId === user._id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(Number(e.target.value))}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                          >
                            <option value={2}>Quản trị viên</option>
                            <option value={3}>Biên tập viên</option>
                          </select>
                          <button
                            onClick={() => handleAddMember(user._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                            title="Xác nhận thêm thành viên"
                          >
                            <UserPlus size={20} />
                          </button>
                          <button
                            onClick={() => setSelectedUserId(null)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
                            title="Hủy"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedUserId(user._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                          title="Thêm thành viên"
                        >
                          <UserPlus size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  {filteredNonMembers.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Không tìm thấy người dùng nào
                    </p>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Thành viên hiện tại</h3>
                <div className="space-y-2">
                  {filteredMembers.map(member => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.user.avatarUrl || '/default-avatar.png'}
                          alt={member.user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{member.user.displayName}</p>
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                          <p className="text-xs text-gray-400">{getRoleName(member.role)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.role !== 1 && ( // Không cho phép chỉnh sửa chủ sở hữu
                          <>
                            {editingMemberId === member._id ? (
                              <div className="flex items-center space-x-2">
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
                              </div>
                            ) : (
                              <>
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
                                <button
                                  onClick={() => handleRemoveMember(member._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                  title="Xóa thành viên"
                                >
                                  <UserMinus size={20} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredMembers.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Chưa có thành viên nào
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageMembersDialog; 