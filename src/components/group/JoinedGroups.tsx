import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useProfile } from '../../types/UserContext';
import { useNavigate } from 'react-router-dom';


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

    useEffect(() => {
        const fetchJoinedGroups = async () => {
            try {
                setIsLoading(true);
                if (!profile?._id) return;
                
                console.log("Current user ID:", profile._id);
                const response = await get('/v1/group-member/list');
                if (!response.data) return;

                console.log("API response:", response.data);
                const memberData = response.data as GroupMemberResponse;
                
                // Filter to only include groups where the current user is a member
                const userGroups = memberData.content.filter(member => 
                    member.user._id === profile._id
                );
                
                console.log("User groups:", userGroups);

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
                console.log("Groups with details:", groupsWithDetails);
                setJoinedGroups(groupsWithDetails);
            } catch (error) {
                console.error('Error fetching joined groups:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJoinedGroups();
    }, [get, profile]);

    const filteredGroups = joinedGroups.filter(member =>
        member?.group?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLeaveGroup = async (e: React.MouseEvent, memberId: string) => {
        e.stopPropagation(); // Prevent triggering the group click
        try {
            await del(`/v1/group-member/delete/${memberId}`);
            // Remove the group from the list
            setJoinedGroups(prev => prev.filter(member => member._id !== memberId));
        } catch (error) {
            console.error('Error leaving group:', error);
        }
    };

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
                                            onClick={(e) => handleLeaveGroup(e, member._id)}
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