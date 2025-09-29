import React, { useState } from 'react';
import { RequestStatus, RequestType } from '../types.jsx';

/**
 * @param {{
 *  isOpen: boolean,
 *  onClose: () => void,
 *  onSubmit: (request: { type: string, contactPerson: string, contactPhone: string, address: string, description: string }) => void
 * }} props
 */
const RequestForm = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState(RequestType.VOLUNTEER);
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contactPerson || !contactPhone || !address || !description) {
      setError('所有欄位皆為必填項目。');
      return;
    }
    setError('');
    onSubmit({
      type,
      contactPerson,
      contactPhone,
      address,
      description,
    });
    // Reset form
    setContactPerson('');
    setContactPhone('');
    setAddress('');
    setDescription('');
    onClose();
  };
  
  const handleTypeChange = (e) => {
    setType(e.target.value);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">登記新的需求</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">需求類型</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="type" value={RequestType.VOLUNTEER} checked={type === RequestType.VOLUNTEER} onChange={handleTypeChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                    <span className="ml-2 text-slate-800">志工人力</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="type" value={RequestType.SUPPLY} checked={type === RequestType.SUPPLY} onChange={handleTypeChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                    <span className="ml-2 text-slate-800">物資需求</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700">聯絡人姓名</label>
                <input type="text" id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-700">聯絡電話</label>
                <input type="tel" id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700">地址或大概位置</label>
                <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">詳細需求說明</label>
                <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
              </div>
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-transparent rounded-md hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500">
                取消
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500">
                送出需求
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;
