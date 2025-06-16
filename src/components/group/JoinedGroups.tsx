import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useProfile } from '../../types/UserContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
//import { useNavigate } from 'react-router-dom';


interface GroupMember {
    _id: string;
    user: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
    group: {
        _id: string;
        name: string;
        description: string;
        avatarUrl?: string;
        members: number;
        privacy: number;
        status: number;
    };
    role: number;
    status: number;
    createdAt: string;
}

interface GroupMemberResponse {
    content: GroupMember[];
    totalPages: number;
    totalElements: number;
}

interface JoinedGroupsProps {
    onGroupClick: (groupId: string) => void;
}

const LoadingSkeleton = () => (
    <div className="space-y-3">
        {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-3 animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                </div>
            </div>
        ))}
    </div>
);

const JoinedGroups: React.FC<JoinedGroupsProps> = ({ onGroupClick }) => {
    const [joinedGroups, setJoinedGroups] = useState<GroupMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { get, del } = useFetch();
    const { profile } = useProfile();

    const fetchJoinedGroups = async () => {
        try {
            setIsLoading(true);
            if (!profile?._id) {
                console.log("No profile ID available");
                return;
            }
            
            const params = {
                user: profile._id,
                isPaged: '0'
            };
            
            const response = await get('/v1/group-member/list', params);
            
            if (!response.data) {
                console.log("No data received from API");
                setJoinedGroups([]);
                return;
            }

            const memberData = response.data as GroupMemberResponse;
            
            if (!memberData.content || memberData.content.length === 0) {
                console.log("No groups found for user");
                setJoinedGroups([]);
                return;
            }

            // Filter out any groups that don't belong to the current user
            const userGroups = memberData.content.filter(member => member.user._id === profile._id);

            // Fetch full details for each group
            const groupDetailsPromises = userGroups.map(async (member) => {
                try {
                    const groupResponse = await get(`/v1/group/get/${member.group._id}`);
                    if (groupResponse.data) {
                        return {
                            ...member,
                            group: {
                                ...member.group,
                                ...groupResponse.data
                            }
                        };
                    }
                    return member;
                } catch (error) {
                    console.error(`Error fetching group ${member.group._id}:`, error);
                    return member;
                }
            });

            const groupsWithDetails = await Promise.all(groupDetailsPromises);
            setJoinedGroups(groupsWithDetails);
        } catch (error) {
            console.error('Error fetching joined groups:', error);
            setJoinedGroups([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJoinedGroups();
    }, [get, profile]);

    const handleLeaveGroup = async (e: React.MouseEvent, memberId: string, groupId: string, groupName: string) => {
        e.stopPropagation(); // Prevent triggering the group click
        
        // Show confirmation dialog with custom styling
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        confirmDialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Xác nhận rời nhóm</h3>
                <p class="text-gray-600 mb-6">Bạn có chắc chắn muốn rời nhóm "${groupName}"?</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancelBtn" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        Hủy
                    </button>
                    <button id="confirmBtn" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                        Rời nhóm
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        // Handle confirmation
        const handleConfirm = async () => {
            try {
                // First, verify the member exists and belongs to the current user
                const verifyResponse = await get('/v1/group-member/list', {
                    user: profile?._id,
                    group: groupId,
                    isPaged: '0'
                });

                console.log('Verify response:', verifyResponse.data);

                if (!verifyResponse.data?.content?.[0]?._id) {
                    throw new Error('Không tìm thấy thông tin thành viên');
                }

                const actualMemberId = verifyResponse.data.content[0]._id;
                console.log('Attempting to delete member with ID:', actualMemberId);

                try {
                    // Delete the member
                    const deleteResponse = await del(`/v1/group-member/delete/${actualMemberId}`);
                    console.log('Delete response:', deleteResponse);

                    // Check if the response indicates success
                    if (deleteResponse && (deleteResponse.status === 200 || deleteResponse.status === 204)) {
                        // Remove the group from the list immediately
                        setJoinedGroups(prev => prev.filter(member => member._id !== memberId));
                        
                        // Show success notification
                        toast.success('Đã rời nhóm thành công!', {
                            position: "top-right",
                            autoClose: 2000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            style: {
                                background: '#10B981',
                                color: 'white',
                                borderRadius: '8px',
                                padding: '12px 16px',
                            },
                        });

                        // Force refresh the list from server
                        setTimeout(async () => {
                            await fetchJoinedGroups();
                        }, 500);
                    } else {
                        console.error('Delete response indicates failure:', deleteResponse);
                        throw new Error('Phản hồi từ server không thành công');
                    }
                } catch (deleteError: any) {
                    console.error('Delete operation failed:', deleteError);
                    // Check if it's a network error
                    if (deleteError.message?.includes('Failed to fetch')) {
                        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
                    }
                    // Check if it's a permission error
                    if (deleteError.status === 403) {
                        throw new Error('Bạn không có quyền rời nhóm này.');
                    }
                    // Check if it's a not found error
                    if (deleteError.status === 404) {
                        throw new Error('Không tìm thấy thông tin thành viên trong nhóm.');
                    }
                    // Generic error
                    throw new Error(deleteError.message || 'Không thể rời nhóm. Vui lòng thử lại sau.');
                }
            } catch (error: any) {
                console.error('Error leaving group:', error);
                toast.error(error.message || 'Không thể rời nhóm. Vui lòng thử lại!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    style: {
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '12px 16px',
                    },
                });
            } finally {
                document.body.removeChild(confirmDialog);
            }
        };

        // Add event listeners
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
        });
        document.getElementById('confirmBtn')?.addEventListener('click', handleConfirm);
    };

    const filteredGroups = joinedGroups.filter(member =>
        member?.group?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="mb-4">
                    <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm nhóm..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredGroups.length > 0 ? (
                <div className="space-y-3">
                    {filteredGroups.map((member) => (
                        <div
                            key={member._id}
                            onClick={() => onGroupClick(member.group._id)}
                            className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {member.group.avatarUrl ? (
                                        <img
                                            src={member.group.avatarUrl}
                                            alt={member.group.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{member.group.name}</h3>
                                    <p className="text-sm text-gray-500">{member.group.members} thành viên</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        member.group.privacy === 1
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {member.group.privacy === 1 ? 'Công khai' : 'Riêng tư'}
                                    </span>
                                    
                                    {member.role !== 1 && ( // Don't show leave button for group owner
                                        <button
                                            onClick={(e) => handleLeaveGroup(e, member._id, member.group._id, member.group.name)}
                                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium hover:bg-red-200 transition-colors duration-200"
                                        >
                                            Rời nhóm
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                        {searchQuery
                            ? 'Không tìm thấy nhóm nào'
                            : 'Bạn chưa tham gia nhóm nào'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default JoinedGroups; 