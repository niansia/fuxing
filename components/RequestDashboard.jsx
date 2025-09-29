import React from 'react';
import { RequestStatus, RequestType } from '../types.jsx';
import RequestCard from './RequestCard.jsx';

/**
 * @param {{
 *  requests: Array<any>,
 *  onUpdateStatus: (id: string, status: string) => void,
 *  onAddVolunteer?: (id: string, volunteer: { name: string, phone: string, note?: string }) => void,
 *  activeFilter: string
 * }} props
 */
const RequestDashboard = ({ requests, onUpdateStatus, onAddVolunteer, activeFilter }) => {
  const filteredRequests = requests.filter(request => {
    if (activeFilter === '全部') return true;
    return request.type === activeFilter;
  });

  const sortedRequests = filteredRequests.sort((a, b) => {
    if (a.status === b.status) {
      return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
    }
    const statusOrder = { [RequestStatus.NEW]: 1, [RequestStatus.IN_PROGRESS]: 2, [RequestStatus.COMPLETED]: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="py-8">
      {sortedRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRequests.map(request => (
            <RequestCard key={request.id} request={request} onUpdateStatus={onUpdateStatus} onAddVolunteer={onAddVolunteer} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">目前沒有需求</h3>
          <p className="mt-1 text-sm text-gray-500">
            點擊「登記新的需求」來新增第一筆資料。
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestDashboard;
