import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AICenter from './pages/AICenter';
import FeaturePage from './components/FeaturePage';
import { featureConfigs } from './featureConfigs';

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'divider1', type: 'divider', label: 'Identity Management' },
  { id: 'digital-identities', label: 'Digital Identities', icon: 'fingerprint' },
  { id: 'did-documents', label: 'DID Documents', icon: 'link' },
  { id: 'identity-verifications', label: 'Verifications', icon: 'scan' },
  { id: 'divider2', type: 'divider', label: 'Credentials' },
  { id: 'verifiable-credentials', label: 'Credentials', icon: 'shield' },
  { id: 'credential-templates', label: 'Templates', icon: 'layout' },
  { id: 'credential-schemas', label: 'Schemas', icon: 'database' },
  { id: 'credential-shares', label: 'Sharing', icon: 'share' },
  { id: 'divider3', type: 'divider', label: 'Trust & Security' },
  { id: 'trust-registry', label: 'Trust Registry', icon: 'award' },
  { id: 'risk-assessments', label: 'Risk Assessments', icon: 'alert' },
  { id: 'compliance-checks', label: 'Compliance', icon: 'clipboard' },
  { id: 'fraud-alerts', label: 'Fraud Alerts', icon: 'siren' },
  { id: 'divider4', type: 'divider', label: 'Operations' },
  { id: 'revocation-entries', label: 'Revocations', icon: 'x-circle' },
  { id: 'presentation-requests', label: 'Presentations', icon: 'send' },
  { id: 'audit-logs', label: 'Audit Trail', icon: 'file-text' },
  { id: 'divider5', type: 'divider', label: 'AI' },
  { id: 'ai-center', label: 'AI Center', icon: 'brain', special: true },
];

function SidebarIcon({ name, className = "w-5 h-5" }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    fingerprint: <><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></>,
    link: <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    scan: <><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><circle cx="12" cy="12" r="3"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></>,
    siren: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></>,
    'x-circle': <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    'file-text': <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    brain: <><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></>,
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.grid}
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser(payload);
        } else {
          localStorage.removeItem('token');
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderPage = () => {
    if (currentPage === 'dashboard') {
      return <Dashboard onNavigate={setCurrentPage} />;
    }
    if (currentPage === 'ai-center') {
      return <AICenter />;
    }
    const config = featureConfigs[currentPage];
    if (config) {
      return <FeaturePage key={currentPage} config={config} />;
    }
    return <Dashboard onNavigate={setCurrentPage} />;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 min-h-screen fixed left-0 top-0 z-40`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          {sidebarOpen && <span className="text-white font-bold text-sm">AI Digital Identity</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {sidebarItems.map(item => {
            if (item.type === 'divider') {
              return sidebarOpen ? (
                <div key={item.id} className="px-4 py-2 mt-2">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{item.label}</span>
                </div>
              ) : <div key={item.id} className="my-1 mx-2 border-t border-slate-800" />;
            }
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition ${
                  isActive
                    ? item.special
                      ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/30'
                      : 'bg-indigo-600/20 text-indigo-300'
                    : item.special
                      ? 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <SidebarIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {user.full_name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate">{user.full_name}</div>
                  <div className="text-slate-500 text-[10px] truncate">{user.role}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition p-1" title="Logout">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-slate-500 hover:text-red-400 transition p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition z-50"
        >
          <svg className={`w-3 h-3 transition ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <button onClick={() => setCurrentPage('dashboard')} className="hover:text-white transition">Home</button>
              <span>/</span>
              <span className="text-white capitalize">{currentPage.replace(/-/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">OpenRouter AI</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
