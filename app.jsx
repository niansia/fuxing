import React, { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import EmergencyTicker from './components/EmergencyTicker.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';
import RequestDashboard from './components/RequestDashboard.jsx';
import RequestForm from './components/RequestForm.jsx';
import { RequestStatus, RequestType } from './types.jsx';

const initialRequests = [
  {
    id: '1',
    type: RequestType.VOLUNTEER,
    status: RequestStatus.NEW,
    contactPerson: '林先生',
    contactPhone: '0912-345-678',
    address: '光復鄉中山路一段123號',
    description: '家門口有倒塌路樹，需要2位志工協助搬運清除。',
    createdAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
    volunteers: [],
  },
  {
    id: '2',
    type: RequestType.SUPPLY,
    status: RequestStatus.IN_PROGRESS,
    contactPerson: '陳小姐',
    contactPhone: '0987-654-321',
    address: '光復車站附近',
    description: '家中停水，急需飲用水與兩箱泡麵，家有兩位長者。',
    createdAt: new Date(Date.now() - 3600 * 2000), // 2 hours ago
    volunteers: [],
  },
    {
    id: '3',
    type: RequestType.SUPPLY,
    status: RequestStatus.COMPLETED,
    contactPerson: '王媽媽',
    contactPhone: '0922-111-333',
    address: '大華國小旁',
    description: '需要嬰兒尿布(M)一包與奶粉。',
    createdAt: new Date(Date.now() - 3600 * 5000), // 5 hours ago
    volunteers: [],
  },
];


const App = () => {
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? () => crypto.randomUUID()
    : () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const [requests, setRequests] = useState(initialRequests);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('全部');

  const addRequest = useCallback((newRequestData) => {
    const newRequest = {
      ...newRequestData,
      id: uuid(),
      status: RequestStatus.NEW,
      createdAt: new Date(),
      volunteers: []
    };
    setRequests(prevRequests => [newRequest, ...prevRequests]);
  }, [uuid]);

  const updateRequestStatus = useCallback((id, status) => {
    setRequests(prevRequests =>
      prevRequests.map(req => (req.id === id ? { ...req, status } : req))
    );
  }, []);

  const addVolunteerToRequest = useCallback((id, volunteer) => {
    setRequests(prev => prev.map(r => (
      r.id === id ? { ...r, volunteers: [...(r.volunteers || []), volunteer] } : r
    )));
  }, []);

  const filters = ['全部', RequestType.VOLUNTEER, RequestType.SUPPLY];

  return (
    <div className="min-h-screen bg-slate-50">
      <EmergencyTicker />
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AlertsPanel />
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full sm:w-auto">
                <div className="flex bg-slate-200 rounded-lg p-1">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeFilter === filter
                                ? 'bg-white text-indigo-700 shadow'
                                : 'text-slate-600 hover:bg-slate-300'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={() => setIsFormOpen(true)}
                className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                登記新的需求
            </button>
        </div>

        <RequestDashboard
          requests={requests}
          onUpdateStatus={updateRequestStatus}
          onAddVolunteer={addVolunteerToRequest}
          activeFilter={activeFilter}
        />
      </main>
      
      <RequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={addRequest}
      />
    </div>
  );
};

export default App;
