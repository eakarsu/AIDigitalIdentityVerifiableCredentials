import React, { useState, useEffect } from 'react';
import { apiGet } from '../api';

const featureCards = [
  { key: 'digital_identities', label: 'Digital Identities', icon: '🆔', color: 'from-indigo-600 to-indigo-800', route: 'digital-identities' },
  { key: 'did_documents', label: 'DID Documents', icon: '🔗', color: 'from-cyan-600 to-cyan-800', route: 'did-documents' },
  { key: 'verifiable_credentials', label: 'Verifiable Credentials', icon: '🛡️', color: 'from-emerald-600 to-emerald-800', route: 'verifiable-credentials' },
  { key: 'identity_verifications', label: 'Identity Verifications', icon: '🔍', color: 'from-violet-600 to-violet-800', route: 'identity-verifications' },
  { key: 'credential_templates', label: 'Credential Templates', icon: '📋', color: 'from-pink-600 to-pink-800', route: 'credential-templates' },
  { key: 'trust_registry', label: 'Trust Registry', icon: '🏆', color: 'from-amber-600 to-amber-800', route: 'trust-registry' },
  { key: 'credential_schemas', label: 'Credential Schemas', icon: '📐', color: 'from-teal-600 to-teal-800', route: 'credential-schemas' },
  { key: 'revocation_entries', label: 'Revocation Registry', icon: '⛔', color: 'from-red-600 to-red-800', route: 'revocation-entries' },
  { key: 'risk_assessments', label: 'Risk Assessments', icon: '⚠️', color: 'from-orange-600 to-orange-800', route: 'risk-assessments' },
  { key: 'compliance_checks', label: 'Compliance Checks', icon: '✅', color: 'from-lime-600 to-lime-800', route: 'compliance-checks' },
  { key: 'fraud_alerts', label: 'Fraud Alerts', icon: '🚨', color: 'from-rose-600 to-rose-800', route: 'fraud-alerts' },
  { key: 'credential_shares', label: 'Credential Sharing', icon: '🔄', color: 'from-sky-600 to-sky-800', route: 'credential-shares' },
  { key: 'presentation_requests', label: 'Presentations', icon: '📤', color: 'from-fuchsia-600 to-fuchsia-800', route: 'presentation-requests' },
  { key: 'audit_logs', label: 'Audit Trail', icon: '📝', color: 'from-slate-600 to-slate-800', route: 'audit-logs' },
];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/dashboard/stats')
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">AI-Powered Digital Identity & Verifiable Credentials Platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-5">
          <div className="text-3xl font-bold text-white">{stats.digital_identities || 0}</div>
          <div className="text-indigo-300 text-sm mt-1">Total Identities</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-2xl p-5">
          <div className="text-3xl font-bold text-white">{stats.verifiable_credentials || 0}</div>
          <div className="text-emerald-300 text-sm mt-1">Active Credentials</div>
        </div>
        <div className="bg-gradient-to-br from-rose-500/20 to-red-500/20 border border-rose-500/30 rounded-2xl p-5">
          <div className="text-3xl font-bold text-white">{stats.fraud_alerts || 0}</div>
          <div className="text-rose-300 text-sm mt-1">Fraud Alerts</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5">
          <div className="text-3xl font-bold text-white">{stats.compliance_checks || 0}</div>
          <div className="text-amber-300 text-sm mt-1">Compliance Checks</div>
        </div>
      </div>

      {/* Feature Cards */}
      <h2 className="text-xl font-bold text-white mb-4">Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {featureCards.map(card => (
          <button
            key={card.key}
            onClick={() => onNavigate(card.route)}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-left transition hover:scale-[1.02] hover:shadow-xl border border-white/10 group`}
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="text-white font-semibold text-lg">{card.label}</h3>
            <div className="flex items-center justify-between mt-3">
              <span className="text-white/70 text-2xl font-bold">
                {loading ? '...' : (stats[card.key] || 0)}
              </span>
              <svg className="w-5 h-5 text-white/50 group-hover:text-white/80 transition transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
