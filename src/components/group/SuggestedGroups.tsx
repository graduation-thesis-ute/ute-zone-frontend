import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { useProfile } from '../../types/UserContext';

interface Group {
    _id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    members: number;
    privacy: number; // 1: Public, 2: Private
    status: number;
    user: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
}

interface GroupMember {
    _id: string;
    user: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
    group: Group;
    role: number;
    status: number;
    createdAt: string;
}

interface GroupResponse {
    content: Group[];
    totalPages: number;
    totalElements: number;
}

interface GroupMemberResponse {
    content: GroupMember[];
    totalPages: number;
    totalElements: number;
}

const SuggestedGroups: React.FC = () => {
    const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { get, post } = useFetch();
    const { profile } = useProfile();

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setIsLoading(true);
                if (!profile?._id) {
                    console.error('User profile not found');
                    return;
                }

                const suggestedResponse = await get('/v1/group/list');
                if (!suggestedResponse.data) return;

                const suggestedData = suggestedResponse.data as GroupResponse;
                const suggestedGroupsPromises = suggestedData.content.map(async (group) => {
                    try {
                        const membersResponse = await get('/v1/group-member/list', { group: group._id });
                        const membersData = membersResponse.data as GroupMemberResponse;
                        const isUserMember = membersData.content.some(member => member.user._id === profile._id);
                        return !isUserMember ? group : null;
                    } catch (error) {
                        return null;
                    }
                });

                const suggestedGroupsResults = await Promise.all(suggestedGroupsPromises);
                const filteredGroups = suggestedGroupsResults
                    .filter((group): group is Group => group !== null)
                    .slice(0, 5);

                setSuggestedGroups(filteredGroups);
            } catch (error) {
                console.error('Error fetching groups:', error);
                setSuggestedGroups([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroups();
    }, [get, profile]);

    const handleJoinGroup = async (groupId: string) => {
        try {
            await post('/v1/group-join-request/send', { groupId });
            setSuggestedGroups(prev => prev.filter(group => group._id !== groupId));
        } catch (error) {
            console.error('Error joining group:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gợi ý cho bạn</h2>
            
            {suggestedGroups.length > 0 ? (
                <div className="space-y-3">
                    {suggestedGroups.map((group) => (
                        <div 
                            key={group._id}
                            className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {group.avatarUrl ? (
                                        <img 
                                            src={group.avatarUrl} 
                                            alt={group.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                                    <p className="text-sm text-gray-500">{group.members} thành viên</p>
                                </div>

                                <button
                                    onClick={() => handleJoinGroup(group._id)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                        group.privacy === 1 
                                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {group.privacy === 1 ? 'Tham gia' : 'Yêu cầu tham gia'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Không có nhóm gợi ý nào</p>
                </div>
            )}
        </div>
    );
};

export default SuggestedGroups; 