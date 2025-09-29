import React from 'react';
import { RequestStatus, RequestType } from '../types.jsx';
import VolunteerSignup from './VolunteerSignup.jsx';

/**
 * @typedef {Object} RequestCardProps
 * @property {any} request
 * @property {(id: string, status: string) => void} onUpdateStatus
 * @property {(id: string, volunteer: { name: string, phone: string, note?: string }) => void=} onAddVolunteer
 */

const statusColors = {
  [RequestStatus.NEW]: 'bg-blue-100 text-blue-800',
  [RequestStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [RequestStatus.COMPLETED]: 'bg-green-100 text-green-800',
};

const typeInfo = {
  [RequestType.VOLUNTEER]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-sky-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    borderColor: 'border-l-4 border-sky-500',
  },
  [RequestType.SUPPLY]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-amber-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    borderColor: 'border-l-4 border-amber-500',
  },
};

/** @param {RequestCardProps} props */
const RequestCard = ({ request, onUpdateStatus }) => {
  const { id, type, status, contactPerson, contactPhone, address, description, createdAt } = request;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ${typeInfo[type].borderColor}`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {typeInfo[type].icon}
            <h3 className="text-lg font-bold text-slate-800">{type}</h3>
          </div>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
            {status}
          </span>
        </div>

        <p className="mt-3 text-slate-700 whitespace-pre-wrap">{description}</p>

        <div className="mt-4 border-t border-slate-200 pt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span>{contactPerson}</span>
          </div>
           <div className="flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            <span>{contactPhone}</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span>{address}</span>
          </div>
          <div className="flex items-center text-xs text-slate-500 pt-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>發佈於: {createdAt.toLocaleString('zh-TW')}</span>
          </div>
        </div>

        {status !== RequestStatus.COMPLETED && (
          <div className="mt-5 pt-4 border-t border-slate-200 flex space-x-2">
            {status === RequestStatus.NEW && (
              <button 
                onClick={() => onUpdateStatus(id, RequestStatus.IN_PROGRESS)}
                className="w-full text-center px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                我來處理
              </button>
            )}
            {status === RequestStatus.IN_PROGRESS && (
              <button 
                onClick={() => onUpdateStatus(id, RequestStatus.COMPLETED)}
                className="w-full text-center px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                標示為已完成
              </button>
            )}
          </div>
        )}
        {type === RequestType.VOLUNTEER && status !== RequestStatus.COMPLETED && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-800">志工報名</h4>
            <VolunteerSignup onSubmit={(vol) => onAddVolunteer && onAddVolunteer(id, vol)} />
            {Array.isArray(request.volunteers) && request.volunteers.length > 0 && (
              <div className="mt-3 text-sm text-slate-700">
                <p className="font-medium">已報名（{request.volunteers.length}）</p>
                <ul className="mt-1 space-y-1">
                  {request.volunteers.map((v, idx) => (
                    <li key={idx} className="flex items-center text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 mr-2">{v.name}</span>
                      <span className="text-slate-500">{v.phone}</span>
                      {v.note ? <span className="ml-2 text-slate-400">（{v.note}）</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;
