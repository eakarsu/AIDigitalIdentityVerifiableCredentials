import React, { useState, useEffect } from 'react';
import AIResultDisplay from './AIResultDisplay';
import { apiPost, apiPut, apiDelete } from '../api';

export default function DetailModal({ item, config, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const data = {};
      config.editFields.forEach(f => {
        data[f.key] = item[f.key] || '';
      });
      setEditData(data);
    }
  }, [item, config]);

  if (!item) return null;

  const handleAiAnalyze = async () => {
    setAiLoading(true);
    try {
      const result = await apiPost(`${config.apiPath}/${item.id}/ai-analyze`);
      setAiResult(result.ai_analysis);
    } catch (err) {
      setAiResult({ content: 'Failed to get AI analysis. Please check your API key.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = { ...editData };
      config.editFields.forEach(f => {
        if (f.type === 'json' && typeof dataToSend[f.key] === 'string') {
          try { dataToSend[f.key] = JSON.parse(dataToSend[f.key]); } catch {}
        }
      });
      await apiPut(`${config.apiPath}/${item.id}`, dataToSend);
      setEditing(false);
      onUpdate();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setDeleting(true);
    try {
      await apiDelete(`${config.apiPath}/${item.id}`);
      onDelete();
      onClose();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl my-8 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{config.detailTitle}</h2>
          <div className="flex gap-2">
            <button onClick={handleAiAnalyze} disabled={aiLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Analyze
            </button>
            <button onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition">
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={onClose} className="px-3 py-2 text-slate-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {editing ? (
            <div className="space-y-4">
              {config.editFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
                  {field.type === 'textarea' || field.type === 'json' ? (
                    <textarea
                      value={field.type === 'json' ? (typeof editData[field.key] === 'object' ? JSON.stringify(editData[field.key], null, 2) : editData[field.key]) : editData[field.key]}
                      onChange={e => setEditData({ ...editData, [field.key]: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={editData[field.key]}
                      onChange={e => setEditData({ ...editData, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={editData[field.key]}
                      onChange={e => setEditData({ ...editData, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.displayFields.map(field => {
                const value = item[field.key];
                return (
                  <div key={field.key} className={`${field.fullWidth ? 'md:col-span-2' : ''} bg-slate-900/50 rounded-xl p-4`}>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{field.label}</div>
                    <div className="text-sm text-slate-200">
                      {field.type === 'json' ? (
                        <pre className="text-xs text-indigo-300 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                      ) : field.type === 'badge' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          value === 'active' || value === 'passed' || value === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          value === 'pending' || value === 'warning' || value === 'investigating' ? 'bg-amber-500/20 text-amber-400' :
                          value === 'critical' || value === 'failed' || value === 'high' ? 'bg-red-500/20 text-red-400' :
                          value === 'open' || value === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>{value}</span>
                      ) : field.type === 'score' ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              parseFloat(value) >= 80 ? 'bg-green-500' :
                              parseFloat(value) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`} style={{ width: `${Math.min(parseFloat(value), 100)}%` }} />
                          </div>
                          <span className="font-mono font-bold">{value}</span>
                        </div>
                      ) : field.type === 'date' ? (
                        value ? new Date(value).toLocaleString() : 'N/A'
                      ) : (
                        String(value ?? 'N/A')
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Result */}
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      </div>
    </div>
  );
}
