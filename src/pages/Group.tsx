import React, { useState, useEffect } from 'react';
import MyGroupDetail from '../components/group/MyGroupDetail';
//import FollowedGroupDetail from '../components/group/FollowedGroupDetail';
import CommunityGroupFeed from '../components/group/CommunityGroupFeed';
import useFetch from '../hooks/useFetch';
import SuggestedGroups from '../components/group/SuggestedGroups';
//import { useNavigate } from 'react-router-dom';
import GroupManagement from '../components/group/GroupManagement';
import JoinedGroups from '../components/group/JoinedGroups';
interface GroupProps {
    groupId: string;
    setSelectedGroupType: (type: string) => void;
}

const Group: React.FC<GroupProps> = ({ groupId, setSelectedGroupType }) => {
    const [groupData, setGroupData] = useState(null);
    const { get } = useFetch();
    //const navigate = useNavigate();

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                // Chỉ fetch khi groupId là một ID hợp lệ và không phải là tab community
                if (groupId && groupId !== "my-groups" && groupId !== "joined-groups" && groupId !== "community" && !groupId.startsWith("community")) {
                    const response = await get(`/v1/group/get/${groupId}`);
                    setGroupData(response.data);
                }
            } catch (error) {
                console.error('Error fetching group data:', error);
            }
        };

        fetchGroupData();
    }, [groupId, get]);

    const handleGroupClick = (groupId: string) => {
        // Không cần setSelectedGroupType cho tab community
        if (groupId !== "my-groups" && groupId !== "joined-groups" && groupId !== "community") {
            setSelectedGroupType(groupId);
        }
    };

    const renderContent = () => {
        // Xử lý các tab đặc biệt trước
        if (groupId === "community" || groupId === "community-groups") {
            return <CommunityGroupFeed />;
        }

        if (groupId === "my-groups") {
            return <MyGroupDetail onGroupClick={handleGroupClick} />;
        }

        if (groupId === "joined-groups") {
            return <JoinedGroups onGroupClick={handleGroupClick} />;
        }

        // Chỉ render GroupManagement khi groupId là một ID hợp lệ (không phải là các tab đặc biệt)
        if (groupId && 
            groupId !== "my-groups" && 
            groupId !== "joined-groups" && 
            groupId !== "community" && 
            groupId !== "community-groups" &&
            !groupId.startsWith("community")) {
            return <GroupManagement groupId={groupId} />;
        }

        // Fallback: hiển thị CommunityGroupFeed nếu không có groupId hợp lệ
        return <CommunityGroupFeed />;
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
