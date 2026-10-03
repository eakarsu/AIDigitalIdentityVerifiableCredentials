import React, { useState, useEffect } from 'react';
import { apiGet } from '../api';
import DetailModal from './DetailModal';
import CreateModal from './CreateModal';

export default function FeaturePage({ config }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await apiGet(config.apiPath);
      const items = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(items)) throw new Error('Invalid list response');
      setItems(items);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [config.apiPath]);

  const filteredItems = items.filter(item => {
    const searchStr = search.toLowerCase();
    return config.searchFields.some(field => {
      const val = item[field];
      if (typeof val === 'string') return val.toLowerCase().includes(searchStr);
      if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(searchStr);
      return String(val).toLowerCase().includes(searchStr);
    });
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{config.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{config.description}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New {config.itemName}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${config.title.toLowerCase()}...`}
          className="w-full max-w-md px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>No items found</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  {config.columns.map(col => (
                    <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} onClick={() => setSelectedItem(item)}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition">
                    {config.columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {col.render ? col.render(item[col.key], item) : (
                          col.type === 'badge' ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item[col.key] === 'active' || item[col.key] === 'passed' || item[col.key] === 'resolved' || item[col.key] === 'low' ? 'bg-green-500/20 text-green-400' :
                              item[col.key] === 'pending' || item[col.key] === 'warning' || item[col.key] === 'investigating' || item[col.key] === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                              item[col.key] === 'critical' || item[col.key] === 'failed' || item[col.key] === 'high' ? 'bg-red-500/20 text-red-400' :
                              item[col.key] === 'open' || item[col.key] === 'fulfilled' ? 'bg-blue-500/20 text-blue-400' :
                              item[col.key] === 'expired' ? 'bg-slate-500/20 text-slate-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>{item[col.key]}</span>
                          ) : col.type === 'score' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  parseFloat(item[col.key]) >= 80 ? 'bg-green-500' :
                                  parseFloat(item[col.key]) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`} style={{ width: `${Math.min(parseFloat(item[col.key]), 100)}%` }} />
                              </div>
                              <span className="font-mono text-xs">{item[col.key]}</span>
                            </div>
                          ) : col.type === 'date' ? (
                            <span className="text-slate-400">{item[col.key] ? new Date(item[col.key]).toLocaleDateString() : 'N/A'}</span>
                          ) : col.type === 'truncate' ? (
                            <span className="text-slate-300 max-w-xs truncate block">{String(item[col.key] || '')}</span>
                          ) : (
                            <span className="text-slate-300">{String(item[col.key] ?? 'N/A')}</span>
                          )
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-700">
            {filteredItems.length} of {items.length} items
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          config={config}
          onClose={() => setSelectedItem(null)}
          onUpdate={() => { fetchItems(); setSelectedItem(null); }}
          onDelete={() => { fetchItems(); }}
        />
      )}
      {showCreate && (
        <CreateModal
          config={config}
          onClose={() => setShowCreate(false)}
          onCreate={() => fetchItems()}
        />
      )}
    </div>
  );
}
