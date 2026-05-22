import { useEffect, useState } from 'react';

export default function SelectiveDisclosurePolicy() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/selective-disclosure-policy').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div className="text-slate-100">
      <h1 className="text-3xl font-bold mb-2">Selective Disclosure Policy</h1>
      <p className="text-slate-400 mb-6">Review verifier requests for over-disclosure and generate minimal proof policies.</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {data && Object.entries(data.summary).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-800 p-4"><div className="text-xs uppercase text-slate-400">{key.replaceAll('_', ' ')}</div><div className="text-2xl font-bold">{value}</div></div>)}
      </div>
      <div className="rounded-lg bg-slate-800">
        {(data?.policies || []).map((item) => <div key={`${item.credential}-${item.verifier}`} className="border-b border-slate-700 p-4"><strong>{item.credential}</strong><div>{item.verifier} - disclose {item.fields.join(', ')} - remove {item.removed.join(', ')}</div></div>)}
      </div>
    </div>
  );
}
