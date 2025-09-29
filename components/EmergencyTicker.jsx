import React, { useEffect, useState, useRef } from 'react';

const EmergencyTicker = () => {
  const [items, setItems] = useState([]);
  const esRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/alerts').then(r=>r.json()).then(data=>{
      if (!cancelled) setItems(data.items || []);
    }).catch(()=>{});

    const es = new EventSource('/api/alerts/stream');
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        setItems(payload.items || []);
      } catch {}
    };
    es.addEventListener('alerts', (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        setItems(payload.items || []);
      } catch {}
    });
    es.onerror = () => { /* keep open */ };
    esRef.current = es;
    return () => { cancelled = true; es?.close(); };
  }, []);

  if (!items.length) return null;

  const text = items.slice(0, 10).map(i => `【${i.source}】${i.title}`).join(' ｜ ');

  return (
    <div className="bg-red-600 text-white text-sm py-2 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap px-4">{text}</div>
      <style>{`
        .animate-marquee { display: inline-block; min-width: 100%; animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
};

export default EmergencyTicker;
