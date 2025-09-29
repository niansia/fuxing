import React, { useState } from 'react';

/**
 * @param {{ onSubmit: (volunteer: { name: string, phone: string, note?: string }) => void, onCancel?: () => void }} props
 */
const VolunteerSignup = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('請輸入姓名與電話');
      return;
    }
    setError('');
    onSubmit({ name, phone, note });
    setName('');
    setPhone('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 bg-slate-50 border border-slate-200 rounded-md p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">姓名</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">電話</label>
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">備註（可選）</label>
        <input value={note} onChange={(e)=>setNote(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-md">取消</button>
        )}
        <button type="submit" className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">送出報名</button>
      </div>
    </form>
  );
};

export default VolunteerSignup;
