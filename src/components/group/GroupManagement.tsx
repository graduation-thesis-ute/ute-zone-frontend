import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, 
    Users,
    Image,
    FileText,
    Settings,
    UserPlus,
    Clock,
    Shield,
    Globe,
    Lock,
    Trash2,
    Edit,
    CheckSquare,
    Square
} from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GroupJoinRequests from './GroupJoinRequests';
import { toast } from 'react-toastify';
import { useProfile } from '../../types/UserContext';
import { ConfimationDialog } from '../Dialog';
import useDialog from '../../hooks/useDialog';
import UpdateGroupDialog from './UpdateGroupDialog';
import CreateGroupPostDialog from './CreateGroupPostDialog';
import GroupPost from './GroupPost';

interface GroupData {
    _id: string;
    name: string;
    description: string;
    members: number;
    postCount: number;
    coverUrl?: string;
    avatarUrl?: string;
    privacy: number;
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

interface GroupPost {
    _id: string;
    content: string;
    imageUrls: string[];
    createdAt: string;
    user: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
    status: number;
    group?: {
        _id: string;
        name: string;
        avatarUrl?: string;
    };
    isOwner?: number;
    updatedAt?: string;
    totalReactions?: number;
    totalComments?: number;
    totalShares?: number;
}

interface GroupPostResponse {
    content: GroupPost[];
    totalPages: number;
    totalElements: number;
}

interface GroupManagementProps {
    groupId: string;
}

const isValidObjectId = (id: string) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

const GroupManagement: React.FC<GroupManagementProps> = ({ groupId }) => {
    // Validate groupId
    if (!groupId || groupId === "community" || groupId === "my-groups" || groupId === "joined-groups") {
        return null;
    }

    const [activeTab, setActiveTab] = useState('posts');
    const [group, setGroup] = useState<GroupData | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    //const [memberCount, setMemberCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMembersLoading, setIsMembersLoading] = useState(false);
    const { get, put, del } = useFetch();
    const { profile } = useProfile();
    const [isOwner, setIsOwner] = useState(false);
    const [userRole, setUserRole] = useState<number | null>(null);
    const { isDialogVisible, showDialog, hideDialog } = useDialog();
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
    const [newRole, setNewRole] = useState<number | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [isUpdateDialogVisible, setIsUpdateDialogVisible] = useState(false);
    const [posts, setPosts] = useState<GroupPost[]>([]);
    const [pendingPosts, setPendingPosts] = useState<GroupPost[]>([]);
    const [isCreatePostDialogVisible, setIsCreatePostDialogVisible] = useState(false);
    const [isPostsLoading, setIsPostsLoading] = useState(false);
    const [isPendingPostsLoading, setIsPendingPostsLoading] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                if (!isValidObjectId(groupId)) {
                    console.error('Invalid group ID');
                    return;
                }
                const response = await get(`/v1/group/get/${groupId}`);
                setGroup(response.data);
            } catch (error) {
                console.error('Error fetching group data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroupData();
    }, [groupId, get]);

    useEffect(() => {
        const fetchMembers = async () => {
            if (activeTab === 'members') {
                try {
                    setIsMembersLoading(true);
                    const response = await get('/v1/group-member/list', { group: groupId });
                    const memberResponse = response.data as GroupMemberResponse;
                    setMembers(memberResponse.content);
                   // setMemberCount(memberResponse.totalElements);
                    
                    // Check if current user is the group owner
                    const currentUserMember = memberResponse.content.find(
                        member => member.user._id === profile?._id
                    );
                    setIsOwner(currentUserMember?.role === 1);
                    setUserRole(currentUserMember?.role || null);
                } catch (error) {
                    console.error('Error fetching members:', error);
                } finally {
                    setIsMembersLoading(false);
                }
            }
        };

        fetchMembers();
    }, [activeTab, groupId, get, profile]);

    const fetchPosts = async () => {
        try {
            setIsPostsLoading(true);
            const response = await get('/v1/group-post/list', { groupId, status: 2 });
            const postResponse = response.data as GroupPostResponse;
            setPosts(postResponse.content);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setIsPostsLoading(false);
        }
    };

    const fetchPendingPosts = async () => {
        try {
            setIsPendingPostsLoading(true);
            const response = await get('/v1/group-post/list', { groupId, status: 1 });
            console.log('API Response:', response);
            const postResponse = response.data as GroupPostResponse;
            console.log('Pending Posts Data:', postResponse);
            setPendingPosts(postResponse.content);
        } catch (error) {
            console.error('Error fetching pending posts:', error);
            toast.error('Có lỗi xảy ra khi tải bài viết chờ duyệt');
        } finally {
            setIsPendingPostsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'posts') {
            fetchPosts();
        } else if (activeTab === 'pending-posts') {
            fetchPendingPosts();
        }
    }, [activeTab, groupId]);

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

    const handleUpdateGroup = () => {
        setIsUpdateDialogVisible(true);
    };

    const handleGroupUpdated = () => {
        // Refresh group data
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

        fetchGroupData();
    };

    const handleChangePrivacy = async () => {
        try {
            await put(`/v1/group/update-privacy/${groupId}`, {
                privacy: group?.privacy === 1 ? 2 : 1
            });
            // Refresh group data
            const response = await get(`/v1/group/get/${groupId}`);
            setGroup(response.data);
            toast.success(`Đã chuyển nhóm sang ${group?.privacy === 1 ? 'riêng tư' : 'công khai'}`);
        } catch (error) {
            console.error('Error changing privacy:', error);
            toast.error('Có lỗi xảy ra khi thay đổi quyền riêng tư');
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await del(`/v1/group/delete/${groupId}`);
            toast.success('Đã xóa nhóm thành công');
            // TODO: Navigate back to groups list
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Có lỗi xảy ra khi xóa nhóm');
        }
    };

    const handlePostCreated = () => {
        fetchPosts();
        fetchPendingPosts();
    };

    const handleApprovePost = async (postId: string) => {
        try {
          console.log(postId);
            if (!postId) {
                console.log('Post ID is undefined or null');
                toast.error('Không tìm thấy bài viết');
                return;
            }
            await put('/v1/group-post/change-status', { id: postId, status: 2 });
            toast.success('Đã duyệt bài viết');
            fetchPendingPosts();
            fetchPosts();
        } catch (error) {
            console.error('Error approving post:', error);
            toast.error('Có lỗi xảy ra khi duyệt bài');
        }
    };

    const handleRejectPost = async (postId: string) => {
        try {
            if (!postId) {
                toast.error('Không tìm thấy bài viết');
                return;
            }
            await put('/v1/group-post/change-status', { id: postId, status: 3 });
            toast.success('Đã từ chối bài viết');
            fetchPendingPosts();
        } catch (error) {
            console.error('Error rejecting post:', error);
            toast.error('Có lỗi xảy ra khi từ chối bài');
        }
    };

    const handleSelectAllPosts = () => {
        if (selectedPosts.length === pendingPosts.length) {
            setSelectedPosts([]);
        } else {
            setSelectedPosts(pendingPosts.map(post => post._id || (post as any).id));
        }
    };

    const handleSelectPost = (postId: string) => {
        setSelectedPosts(prev => {
            if (prev.includes(postId)) {
                return prev.filter(id => id !== postId);
            } else {
                return [...prev, postId];
            }
        });
    };

    const handleApproveSelected = async () => {
        if (selectedPosts.length === 0) {
            toast.warning('Vui lòng chọn bài viết cần duyệt');
            return;
        }

        try {
            setIsLoading(true);
            await Promise.all(
                selectedPosts.map(postId =>
                    put('/v1/group-post/change-status', { id: postId, status: 2 })
                )
            );
            toast.success(`Đã duyệt ${selectedPosts.length} bài viết`);
            setSelectedPosts([]);
            fetchPendingPosts();
            fetchPosts();
        } catch (error) {
            console.error('Error approving posts:', error);
            toast.error('Có lỗi xảy ra khi duyệt bài');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectSelected = async () => {
        if (selectedPosts.length === 0) {
            toast.warning('Vui lòng chọn bài viết cần từ chối');
            return;
        }

        try {
            setIsLoading(true);
            await Promise.all(
                selectedPosts.map(postId =>
                    put('/v1/group-post/change-status', { id: postId, status: 3 })
                )
            );
            toast.success(`Đã từ chối ${selectedPosts.length} bài viết`);
            setSelectedPosts([]);
            fetchPendingPosts();
        } catch (error) {
            console.error('Error rejecting posts:', error);
            toast.error('Có lỗi xảy ra khi từ chối bài');
        } finally {
            setIsLoading(false);
        }
    };

    // Close settings dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const tabs = [
        { id: 'posts', label: 'Bài viết', icon: MessageSquare },
        { id: 'members', label: 'Thành viên', icon: Users },
        ...(userRole !== 3 ? [
            { id: 'pending-posts', label: 'Duyệt bài', icon: Clock },
            { id: 'pending-members', label: 'Yêu cầu tham gia', icon: UserPlus },
        ] : []),
        { id: 'media', label: 'Ảnh/Video', icon: Image },
        { id: 'files', label: 'Tệp', icon: FileText }
    ];

    const renderMembersContent = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Thành viên nhóm</h2>
                {userRole !== 3 && (
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                        <UserPlus className="w-5 h-5 mr-2 inline-block" />
                        Thêm thành viên
                    </button>
                )}
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

    const renderPostsContent = () => (
        <div className="space-y-4">
            {isPostsLoading ? (
                <div key="loading" className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : posts.length > 0 ? (
                posts.map(post => {
                    const postId = post._id || (post as any).id;
                    const mappedPost = {
                        ...post,
                        id: postId,
                        totalReactions: post.totalReactions || 0,
                        totalComments: post.totalComments || 0,
                        totalShares: post.totalShares || 0
                    };
                    return <GroupPost key={postId} post={mappedPost} />;
                })
            ) : (
                <div key="no-posts" className="text-center text-gray-500 py-8">
                    Chưa có bài viết nào.
                </div>
            )}
        </div>
    );

    const renderPendingPostsContent = () => {
        return (
            <div className="space-y-4">
                {isPendingPostsLoading ? (
                    <div key="loading" className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : pendingPosts.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleSelectAllPosts}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    {selectedPosts.length === pendingPosts.length ? (
                                        <CheckSquare className="w-6 h-6 text-blue-500" />
                                    ) : (
                                        <Square className="w-6 h-6 text-gray-400" />
                                    )}
                                </button>
                                <span className="text-sm text-gray-500">
                                    {selectedPosts.length} bài viết được chọn
                                </span>
                            </div>
                            {selectedPosts.length > 0 && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleApproveSelected}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                    >
                                        Duyệt {selectedPosts.length} bài
                                    </button>
                                    <button
                                        onClick={handleRejectSelected}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Từ chối {selectedPosts.length} bài
                                    </button>
                                </div>
                            )}
                        </div>
                        {pendingPosts.map(post => {
                            const postId = post._id || (post as any).id;
                            return (
                                <div key={postId} className="bg-white rounded-lg shadow">
                                    <div className="flex items-center px-4 py-2 border-b border-gray-100">
                                        <button
                                            onClick={() => handleSelectPost(postId)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            {selectedPosts.includes(postId) ? (
                                                <CheckSquare className="w-5 h-5 text-blue-500" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    <GroupPost key={`post-${postId}`} post={{
                                        ...post,
                                        id: postId,
                                        totalReactions: post.totalReactions || 0,
                                        totalComments: post.totalComments || 0,
                                        totalShares: post.totalShares || 0
                                    }} />
                                    <div className="px-4 py-2 border-t border-gray-200 flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleApprovePost(postId)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            onClick={() => handleRejectPost(postId)}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <div key="no-pending-posts" className="text-center text-gray-500 py-8">
                        Không có bài viết nào chờ duyệt.
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'posts':
                return renderPostsContent();
            case 'members':
                return renderMembersContent();
            case 'pending-posts':
                return renderPendingPostsContent();
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
                {group.coverUrl && (
                    <img 
                        src={group.coverUrl} 
                        alt={`${group.name} cover`}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Group Info */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center -mt-8 relative z-10">
                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                        {group.avatarUrl ? (
                            <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                <Users className="w-16 h-16 text-blue-500" />
                            </div>
                        )}
                    </div>

                    {/* Group Name & Stats */}
                    <div className="ml-4">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                            <div className="flex items-center text-sm text-gray-500">
                                {group.privacy === 1 ? (
                                    <>
                                        <Globe className="w-4 h-4 mr-1" />
                                        <span>Công khai</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-1" />
                                        <span>Riêng tư</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <p className="text-gray-500">{group.members} thành viên</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-auto flex items-center space-x-3">
                        <button 
                            onClick={() => setIsCreatePostDialogVisible(true)}
                            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Đăng bài
                        </button>
                        {userRole !== 3 && (
                            <div ref={settingsRef} className="relative">
                                <button 
                                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                {isSettingsOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                        <button
                                            onClick={handleUpdateGroup}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Cập nhật thông tin
                                        </button>
                                        <button
                                            onClick={handleChangePrivacy}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            {group.privacy === 1 ? (
                                                <>
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Chuyển sang riêng tư
                                                </>
                                            ) : (
                                                <>
                                                    <Globe className="w-4 h-4 mr-2" />
                                                    Chuyển sang công khai
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleDeleteGroup}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xóa nhóm
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
            <UpdateGroupDialog
                isVisible={isUpdateDialogVisible}
                onClose={() => setIsUpdateDialogVisible(false)}
                onGroupUpdated={handleGroupUpdated}
                group={group}
            />
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
            <CreateGroupPostDialog
                isVisible={isCreatePostDialogVisible}
                onClose={() => setIsCreatePostDialogVisible(false)}
                onPostCreated={handlePostCreated}
                groupId={groupId}
            />
        </div>
    );
};

export default GroupManagement; 