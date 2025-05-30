import React, { useState, useEffect } from 'react';
import MyGroupDetail from '../components/group/MyGroupDetail';
import FollowedGroupDetail from '../components/group/FollowedGroupDetail';
import CommunityGroupFeed from '../components/group/CommunityGroupFeed';
import useFetch from '../hooks/useFetch';
import SuggestedGroups from '../components/group/SuggestedGroups';
import { useNavigate } from 'react-router-dom';
import GroupManagement from '../components/group/GroupManagement';
import JoinedGroups from '../components/group/JoinedGroups';
interface GroupProps {
    groupId: string;
    setSelectedGroupType: (type: string) => void;
}

const Group: React.FC<GroupProps> = ({ groupId, setSelectedGroupType }) => {
    const [groupData, setGroupData] = useState(null);
    const { get } = useFetch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                // If groupId is "my-groups", "followed", or "community", don't fetch
                if (groupId === "my-groups" || groupId === "joined-groups" || groupId === "community") {
                    return;
                }

                // Fetch group details
                const response = await get(`/v1/group/get/${groupId}`);
                setGroupData(response.data);
            } catch (error) {
                console.error('Error fetching group data:', error);
            }
        };

        fetchGroupData();
    }, [groupId, get]);

    const handleGroupClick = (groupId: string) => {
        // Nếu groupId là ID của một nhóm cụ thể, hiển thị GroupManagement
        if (groupId !== "my-groups" && groupId !== "joined-groups" && groupId !== "community") {
            setSelectedGroupType(groupId);
        }
    };

    const renderContent = () => {
        // Nếu groupId là ID của một nhóm cụ thể, hiển thị GroupManagement
        if (groupId !== "my-groups" && groupId !== "joined-groups" && groupId !== "community") {
            return <GroupManagement groupId={groupId} />;
        }

        // Ngược lại, hiển thị danh sách nhóm
        switch (groupId) {
            case "my-groups":
                return <MyGroupDetail onGroupClick={handleGroupClick} />;
            case "joined-groups":
                return <JoinedGroups onGroupClick={handleGroupClick} />;
            case "community":
                return groupData ? <CommunityGroupFeed group={groupData} /> : null;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-full">
            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>

            {/* Suggested groups sidebar */}
            <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
                <SuggestedGroups />
            </div>
        </div>
    );
};

export default Group;
