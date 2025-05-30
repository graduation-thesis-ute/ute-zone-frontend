import React, { useState, useEffect } from 'react';
import { Users, Check, X, CheckSquare, Square } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { toast } from 'react-toastify';

interface JoinRequest {
    id: string;
    group: {
        _id: string;
        name: string;
        avatarUrl?: string;
    };
    user: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
    status: number;
    requestedAt: string;
    createdAt: string;
}

interface JoinRequestResponse {
    joinRequests: JoinRequest[];
    total: number;
    page: number;
    totalPages: number;
}

interface GroupJoinRequestsProps {
    groupId: string;
}

const GroupJoinRequests: React.FC<GroupJoinRequestsProps> = ({ groupId }) => {
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
    const { get, put } = useFetch();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setIsLoading(true);
                const response = await get(`/v1/group-join-request/list?groupId=${groupId}&status=1`);
                if (response.data) {
                    const data = response.data as JoinRequestResponse;
                    setRequests(data.joinRequests);
                }
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching join requests:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [get, groupId]);

    const handleAccept = async (requestId: string) => {
        try {
            await put(`/v1/group-join-request/accept`, { requestId });
            setRequests(prev => prev.filter(req => req.id !== requestId));
            setSelectedRequests(prev => {
                const next = new Set(prev);
                next.delete(requestId);
                return next;
            });
            toast.success('Đã chấp nhận yêu cầu tham gia nhóm');
        } catch (error) {
            console.error('Error accepting request:', error);
            toast.error('Có lỗi xảy ra khi chấp nhận yêu cầu');
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await put(`/v1/group-join-request/reject/${requestId}`, {});
            setRequests(prev => prev.filter(req => req.id !== requestId));
            setSelectedRequests(prev => {
                const next = new Set(prev);
                next.delete(requestId);
                return next;
            });
            toast.success('Đã từ chối yêu cầu tham gia nhóm');
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Có lỗi xảy ra khi từ chối yêu cầu');
        }
    };

    const handleSelectAll = () => {
        if (selectedRequests.size === requests.length) {
            setSelectedRequests(new Set());
        } else {
            setSelectedRequests(new Set(requests.map(req => req.id)));
        }
    };

    const handleSelectRequest = (requestId: string) => {
        setSelectedRequests(prev => {
            const next = new Set(prev);
            if (next.has(requestId)) {
                next.delete(requestId);
            } else {
                next.add(requestId);
            }
            return next;
        });
    };

    const handleBatchAccept = async () => {
        try {
            const promises = Array.from(selectedRequests).map(requestId => 
                handleAccept(requestId)
            );
            await Promise.all(promises);
            toast.success('Đã chấp nhận các yêu cầu tham gia nhóm');
        } catch (error) {
            console.error('Error in batch accept:', error);
            toast.error('Có lỗi xảy ra khi chấp nhận các yêu cầu');
        }
    };

    const handleBatchReject = async () => {
        try {
            const promises = Array.from(selectedRequests).map(requestId => 
                handleReject(requestId)
            );
            await Promise.all(promises);
            toast.success('Đã từ chối các yêu cầu tham gia nhóm');
        } catch (error) {
            console.error('Error in batch reject:', error);
            toast.error('Có lỗi xảy ra khi từ chối các yêu cầu');
        }
    };

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                                <div className="flex space-x-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded" />
                                    <div className="w-8 h-8 bg-gray-200 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Yêu cầu tham gia</h2>
                {requests.length > 0 && (
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            {selectedRequests.size === requests.length ? (
                                <CheckSquare className="w-5 h-5 mr-2" />
                            ) : (
                                <Square className="w-5 h-5 mr-2" />
                            )}
                            Chọn tất cả
                        </button>
                        {selectedRequests.size > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                    Đã chọn {selectedRequests.size}
                                </span>
                                <button
                                    onClick={handleBatchAccept}
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Duyệt
                                </button>
                                <button
                                    onClick={handleBatchReject}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Từ chối
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {requests.length > 0 ? (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => handleSelectRequest(request.id)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {selectedRequests.has(request.id) ? (
                                        <CheckSquare className="w-5 h-5" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>

                                {/* User Avatar */}
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                                    {request.user.avatarUrl ? (
                                        <img
                                            src={request.user.avatarUrl}
                                            alt={request.user.displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">
                                        {request.user.displayName}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Yêu cầu tham gia {request.createdAt}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleAccept(request.id)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
                                        title="Chấp nhận"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleReject(request.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                                        title="Từ chối"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Không có yêu cầu tham gia nào</p>
                </div>
            )}
        </div>
    );
};

export default GroupJoinRequests; 