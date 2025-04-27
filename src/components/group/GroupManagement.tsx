import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    Users,
    Image,
    FileText,
    Settings,
    Plus,
    CheckCircle,
    UserPlus,
    Clock,
    Shield,
    MoreVertical,
    ChevronDown
} from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GroupJoinRequests from './GroupJoinRequests';
import { toast } from 'react-toastify';
import { useProfile } from '../../types/UserContext';
import { ConfimationDialog } from '../Dialog';
import useDialog from '../../hooks/useDialog';

interface GroupData {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    postCount: number;
    coverImage?: string;
    avatar?: string;
}

interface GroupMember {
    _id: string;
    user: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
    group: {
        _id: string;
    };
    role: number; // 1: Owner, 2: Admin, 3: Member
    status: number;
    createdAt: string;
}

interface GroupMemberResponse {
    content: GroupMember[];
    totalPages: number;
    totalElements: number;
}

interface GroupManagementProps {
    groupId: string;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ groupId }) => {
    const [activeTab, setActiveTab] = useState('posts');
    const [group, setGroup] = useState<GroupData | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMembersLoading, setIsMembersLoading] = useState(false);
    const { get, put, del } = useFetch();
    const { profile } = useProfile();
    const [isOwner, setIsOwner] = useState(false);
    const { isDialogVisible, showDialog, hideDialog } = useDialog();
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
    const [newRole, setNewRole] = useState<number | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                setIsLoading(true);
                const response = await get(`/v1/group/get/${groupId}`);
                setGroup(response.data);
            } catch (error) {
                console.error('Error fetching group data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (groupId) {
            fetchGroupData();
        }
    }, [groupId, get]);

    useEffect(() => {
        const fetchMembers = async () => {
            if (activeTab === 'members') {
                try {
                    setIsMembersLoading(true);
                    const response = await get('/v1/group-member/list', { group: groupId });
                    const memberResponse = response.data as GroupMemberResponse;
                    setMembers(memberResponse.content);
                    
                    // Check if current user is the group owner
                    const currentUserMember = memberResponse.content.find(
                        member => member.user._id === profile?._id
                    );
                    setIsOwner(currentUserMember?.role === 1);
                } catch (error) {
                    console.error('Error fetching members:', error);
                } finally {
                    setIsMembersLoading(false);
                }
            }
        };

        fetchMembers();
    }, [activeTab, groupId, get, profile]);

    const handleUpdateRole = async (memberId: string, newRole: number) => {
        try {
            await put('/v1/group-member/update-role', {
                groupMemberId: memberId,
                role: newRole
            });
            // Refresh member list
            const response = await get('/v1/group-member/list', { group: groupId });
            setMembers(response.data.content);
            toast.success('Đã cập nhật vai trò thành viên');
        } catch (error) {
            console.error('Error updating member role:', error);
            toast.error('Có lỗi xảy ra khi cập nhật vai trò');
        }
    };

    const handleRoleChange = (member: GroupMember, role: number) => {
        setSelectedMember(member);
        setNewRole(role);
        showDialog();
    };

    const confirmRoleChange = async () => {
        if (selectedMember && newRole) {
            await handleUpdateRole(selectedMember._id, newRole);
            hideDialog();
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await del(`/v1/group-member/delete`, { groupMemberId: memberId });
            // Refresh member list
            const response = await get('/v1/group-member/list', { groupId });
            setMembers(response.data);
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const getRoleName = (role: number) => {
        switch (role) {
            case 1:
                return 'Chủ nhóm';
            case 2:
                return 'Quản trị viên';
            case 3:
                return 'Thành viên';
            default:
                return 'Không xác định';
        }
    };

    const toggleDropdown = (memberId: string) => {
        setOpenDropdownId(openDropdownId === memberId ? null : memberId);
    };

    const renderRoleDropdown = (member: GroupMember) => {
        if (!isOwner || member.role === 1) return null;

        return (
            <div className="relative">
                <button 
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                    title="Thay đổi vai trò"
                    onClick={() => toggleDropdown(member._id)}
                >
                    <Shield className="w-5 h-5" />
                </button>
                {openDropdownId === member._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <button
                            onClick={() => handleRoleChange(member, 2)}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                                member.role === 2 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Quản trị viên
                        </button>
                        <button
                            onClick={() => handleRoleChange(member, 3)}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                                member.role === 3 ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Thành viên
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const tabs = [
        { id: 'posts', label: 'Bài viết', icon: MessageSquare },
        { id: 'members', label: 'Thành viên', icon: Users },
        { id: 'pending-posts', label: 'Duyệt bài', icon: Clock },
        { id: 'pending-members', label: 'Yêu cầu tham gia', icon: UserPlus },
        { id: 'media', label: 'Ảnh/Video', icon: Image },
        { id: 'files', label: 'Tệp', icon: FileText },
        { id: 'settings', label: 'Cài đặt', icon: Settings }
    ];

    const renderMembersContent = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Thành viên nhóm</h2>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    <UserPlus className="w-5 h-5 mr-2 inline-block" />
                    Thêm thành viên
                </button>
            </div>
            {isMembersLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : members.length > 0 ? (
                <div className="bg-white rounded-lg shadow divide-y">
                    {members.map(member => (
                        <div key={member._id} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                        {member.user.avatarUrl ? (
                                            <img 
                                                src={member.user.avatarUrl} 
                                                alt={member.user.displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                                <Users className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{member.user.displayName}</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-sm ${
                                                member.role === 1 ? 'text-red-500' :
                                                member.role === 2 ? 'text-blue-500' :
                                                'text-gray-500'
                                            }`}>
                                                {getRoleName(member.role)}
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-sm text-gray-500">
                                                Tham gia {member.createdAt}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {isOwner && member.role !== 1 && (
                                        <>
                                            {renderRoleDropdown(member)}
                                            <button 
                                                onClick={() => handleRemoveMember(member._id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                                                title="Xóa khỏi nhóm"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-8">
                    Chưa có thành viên nào.
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'posts':
                return (
                    <div className="text-center text-gray-500 py-8">
                        Chưa có bài viết nào.
                    </div>
                );
            case 'members':
                return renderMembersContent();
            case 'pending-posts':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Bài viết chờ duyệt</h2>
                            <div className="flex space-x-2">
                                <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                                    Duyệt tất cả
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-4 border-b">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">Nguyễn Văn A</h3>
                                        <p className="text-gray-500 text-sm">2 giờ trước</p>
                                        <p className="mt-2">Nội dung bài viết chờ duyệt...</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="p-2 text-green-500 hover:bg-green-50 rounded-full">
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'pending-members':
                return <GroupJoinRequests groupId={groupId} />;
            default:
                return (
                    <div className="text-center text-gray-500 py-8">
                        Chưa có nội dung.
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy nhóm</h2>
                    <p className="text-gray-500">Nhóm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* Cover Photo */}
            <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                {group.coverImage && (
                    <img 
                        src={group.coverImage} 
                        alt={`${group.name} cover`}
                        className="w-full h-full object-cover"
                    />
                )}
                <button className="absolute bottom-4 right-4 flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-md hover:bg-white/30">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm ảnh bìa
                </button>
            </div>

            {/* Group Info */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center -mt-8 relative z-10">
                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                        {group.avatar ? (
                            <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                <Users className="w-16 h-16 text-blue-500" />
                            </div>
                        )}
                    </div>

                    {/* Group Name & Stats */}
                    <div className="ml-4">
                        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                        <p className="text-gray-500">{group.memberCount} thành viên</p>
                    </div>

                    {/* Action Button */}
                    <div className="ml-auto">
                        <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                            Đăng bài
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200 mt-8 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-6 py-4 whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-b-2 border-blue-500 text-blue-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Icon className="w-5 h-5 mr-2" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="py-6">
                    {renderContent()}
                </div>
            </div>
            <ConfimationDialog
                isVisible={isDialogVisible}
                title="Xác nhận thay đổi vai trò"
                message={`Bạn có chắc chắn muốn thay đổi vai trò của ${selectedMember?.user.displayName} thành ${
                    newRole === 2 ? 'Quản trị viên' : 'Thành viên'
                }?`}
                onConfirm={confirmRoleChange}
                confirmText="Xác nhận"
                onCancel={hideDialog}
                color="blue"
            />
        </div>
    );
};

export default GroupManagement; 