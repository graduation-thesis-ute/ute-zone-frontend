import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';

interface User {
    _id: string;
    displayName: string;
    avatarUrl?: string;
}

interface AddMemberDialogProps {
    isVisible: boolean;
    onClose: () => void;
    onMemberAdded: () => void;
    groupId: string;
}

const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
    isVisible,
    onClose,
    onMemberAdded,
    groupId
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { get, post } = useFetch();

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await get('/v1/user/list');
            setUsers(response.data.content);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Có lỗi xảy ra khi tải danh sách người dùng');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isVisible) {
            fetchUsers();
        }
    }, [isVisible]);

    const handleAddMember = async (userId: string) => {
        try {
            await post('/v1/group-member/add', {
                group: groupId,
                user: userId,
                role: 3 // Default role is member
            });
            toast.success('Đã thêm thành viên vào nhóm');
            onMemberAdded();
        } catch (error) {
            console.error('Error adding member:', error);
            toast.error('Có lỗi xảy ra khi thêm thành viên');
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold">Thêm thành viên</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="space-y-2">
                            {filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                                    <UserPlus className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-medium">{user.displayName}</span>
                                    </div>
                                    <button
                                        onClick={() => handleAddMember(user._id)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                    >
                                        Thêm
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            Không tìm thấy người dùng nào.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddMemberDialog; 