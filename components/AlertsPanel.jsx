import React, { useEffect, useState } from 'react';

const AlertsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch('/api/alerts');
        const data = await r.json();
        if (!cancelled) setItems(data.items || []);
      } catch (e) {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="mt-6 bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800">緊急通知與最新訊息</h3>
        <button onClick={()=>window.location.reload()} className="text-sm text-indigo-600 hover:underline">重新整理</button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">載入中…</p>
      ) : items.length ? (
        <ul className="divide-y divide-slate-200">
          {items.slice(0, 30).map((i, idx) => (
            <li key={idx} className="py-2">
              <a className="text-slate-800 hover:text-indigo-700 font-medium" href={i.link} target="_blank" rel="noreferrer">{i.title}</a>
              <div className="text-xs text-slate-500 mt-0.5">來源：{i.source}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">目前沒有可顯示的資訊。</p>
      )}
    </section>
  );
};

export default AlertsPanel;
