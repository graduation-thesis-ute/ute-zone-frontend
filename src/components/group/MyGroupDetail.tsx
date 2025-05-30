import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GroupCard from './GroupCard';
import CreateGroupDialog from './CreateGroupDialog';

interface Group {
    _id: string;
    name: string;
    description: string;
    memberCount: number;
    postCount: number;
    coverUrl?: string;
    avatarUrl?: string;
    isOwner: number;
    privacy: number;
    status: number;
    members: number;
    createdAt: string;
    user: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
}

interface GroupResponse {
    content: Group[];
    totalPages: number;
    totalElements: number;
}

interface MyGroupDetailProps {
    onGroupClick: (groupId: string) => void;
}

const MyGroupDetail: React.FC<MyGroupDetailProps> = ({ onGroupClick }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
    const { get } = useFetch();

    const fetchMyGroups = async () => {
        try {
            setIsLoading(true);
            const response = await get('/v1/group/list?isOwner=1');
            const data: GroupResponse = response.data;
            const myGroups = data.content.filter(group => group.isOwner === 1) || [];
            setGroups(myGroups);
            console.log("myGroups", myGroups);
        } catch (error) {
            console.error('Error fetching my groups:', error);
            setGroups([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyGroups();
    }, []);

    const handleSettingsClick = (e: React.MouseEvent, groupId: string) => {
        e.stopPropagation();
        // Xử lý khi click vào nút settings
        console.log('Settings clicked for group:', groupId);
    };

    const handleCreateGroup = () => {
        setIsCreateDialogVisible(true);
    };

    const handleGroupCreated = () => {
        // Refresh the groups list
        fetchMyGroups();
    };

    const filteredGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nhóm của tôi</h1>
                <button 
                    onClick={handleCreateGroup}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Tạo nhóm mới
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nhóm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <Filter className="w-5 h-5 mr-2 text-gray-500" />
                    Lọc
                </button>
            </div>

            {/* Groups List */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredGroups.length > 0 ? (
                <div className="space-y-4">
                    {filteredGroups.map((group) => (
                        <GroupCard
                            key={group._id}
                            id={group._id}
                            name={group.name}
                            description={group.description}
                            memberCount={group.members}
                            postCount={group.postCount}
                            type="my"
                            coverImage={group.coverUrl}
                            avatar={group.avatarUrl}
                            onGroupClick={onGroupClick}
                            onSettingsClick={handleSettingsClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Bạn chưa có nhóm nào</h3>
                    <p className="text-gray-500 mb-4">Tạo nhóm mới để bắt đầu kết nối với bạn bè</p>
                    <button 
                        onClick={handleCreateGroup}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                        Tạo nhóm mới
                    </button>
                </div>
            )}

            <CreateGroupDialog
                isVisible={isCreateDialogVisible}
                onClose={() => setIsCreateDialogVisible(false)}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    );
};

export default MyGroupDetail; 