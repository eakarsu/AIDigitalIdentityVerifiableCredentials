import React, { useState } from 'react';
import { apiPost } from '../api';

export default function CreateModal({ config, onClose, onCreate }) {
  const [formData, setFormData] = useState(() => {
    const initial = {};
    config.editFields.forEach(f => {
      initial[f.key] = f.default || '';
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = { ...formData };
      config.editFields.forEach(f => {
        if (f.type === 'json' && typeof dataToSend[f.key] === 'string') {
          try { dataToSend[f.key] = JSON.parse(dataToSend[f.key]); } catch {}
        }
      });
      await apiPost(config.apiPath, dataToSend);
      onCreate();
      onClose();
    } catch (err) {
      alert('Failed to create: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl my-8 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">New {config.detailTitle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {config.editFields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
              {field.type === 'textarea' || field.type === 'json' ? (
                <textarea
                  value={formData[field.key]}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  rows={3}
                  placeholder={field.placeholder || ''}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.key]}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select...</option>
                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formData[field.key]}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder || ''}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition disabled:opacity-50">
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
