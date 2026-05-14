import React, { useState } from 'react';
import { apiPost } from '../api';
import AIResultDisplay from '../components/AIResultDisplay';

const aiFeatures = [
  {
    id: 'verify-identity',
    title: 'AI Identity Verification',
    description: 'Analyze and verify digital identities using AI',
    icon: '🔍',
    color: 'indigo',
    endpoint: '/ai-center/verify-identity',
    fields: [
      { key: 'name', label: 'Identity Name', placeholder: 'e.g., John Doe Personal Identity' },
      { key: 'type', label: 'Identity Type', placeholder: 'e.g., Personal, Organization' },
      { key: 'documents', label: 'Documents Provided', placeholder: 'e.g., passport, utility bill' },
      { key: 'country', label: 'Country', placeholder: 'e.g., US, UK, EU' },
    ],
    dataKey: 'identityData',
  },
  {
    id: 'validate-credential',
    title: 'AI Credential Validator',
    description: 'Validate verifiable credentials for W3C compliance',
    icon: '✅',
    color: 'emerald',
    endpoint: '/ai-center/validate-credential',
    fields: [
      { key: 'type', label: 'Credential Type', placeholder: 'e.g., UniversityDegree' },
      { key: 'issuer', label: 'Issuer', placeholder: 'e.g., did:web:mit.edu' },
      { key: 'subject', label: 'Subject', placeholder: 'e.g., did:key:z6Mkh...' },
      { key: 'claims', label: 'Claims', placeholder: 'e.g., degree: BSc, gpa: 3.85' },
    ],
    dataKey: 'credentialData',
  },
  {
    id: 'assess-risk',
    title: 'AI Risk Assessment',
    description: 'Comprehensive risk scoring for identities and credentials',
    icon: '⚠️',
    color: 'orange',
    endpoint: '/ai-center/assess-risk',
    fields: [
      { key: 'entityType', label: 'Entity Type', placeholder: 'e.g., identity, credential' },
      { key: 'name', label: 'Entity Name', placeholder: 'e.g., Corporate Identity' },
      { key: 'status', label: 'Current Status', placeholder: 'e.g., active, pending' },
      { key: 'factors', label: 'Known Risk Factors', placeholder: 'e.g., multiple_logins, geo_mismatch' },
    ],
    dataKey: 'entityData',
  },
  {
    id: 'detect-fraud',
    title: 'AI Fraud Detection',
    description: 'Detect fraud patterns in identity transactions',
    icon: '🚨',
    color: 'red',
    endpoint: '/ai-center/detect-fraud',
    fields: [
      { key: 'transactionType', label: 'Transaction Type', placeholder: 'e.g., credential_issuance, presentation' },
      { key: 'actor', label: 'Actor', placeholder: 'e.g., did:key:z6Mkh...' },
      { key: 'action', label: 'Action', placeholder: 'e.g., multiple rapid presentations' },
      { key: 'context', label: 'Context', placeholder: 'e.g., new device, unusual location' },
    ],
    dataKey: 'transactionData',
  },
  {
    id: 'check-compliance',
    title: 'AI Compliance Checker',
    description: 'Check regulatory compliance (GDPR, eIDAS, W3C)',
    icon: '📋',
    color: 'lime',
    endpoint: '/ai-center/check-compliance',
    fields: [
      { key: 'entityType', label: 'Entity Type', placeholder: 'e.g., identity system, credential' },
      { key: 'description', label: 'Description', placeholder: 'e.g., User identity management system' },
      { key: 'dataProcessing', label: 'Data Processing Activities', placeholder: 'e.g., collection, storage, sharing' },
      { key: 'framework', label: 'Framework', placeholder: 'e.g., GDPR, eIDAS, HIPAA' },
    ],
    dataKey: 'entityData',
  },
  {
    id: 'analyze-did',
    title: 'AI DID Analyzer',
    description: 'Analyze DID documents for security and compliance',
    icon: '🔗',
    color: 'cyan',
    endpoint: '/ai-center/analyze-did',
    fields: [
      { key: 'didUri', label: 'DID URI', placeholder: 'e.g., did:key:z6MkhaXg...' },
      { key: 'method', label: 'DID Method', placeholder: 'e.g., key, web, ion' },
      { key: 'verificationMethods', label: 'Verification Methods', placeholder: 'e.g., Ed25519, ECDSA' },
      { key: 'services', label: 'Services', placeholder: 'e.g., LinkedDomains, CredentialRegistry' },
    ],
    dataKey: 'didDocument',
  },
  {
    id: 'calculate-trust',
    title: 'AI Trust Score Calculator',
    description: 'Calculate comprehensive trust scores for entities',
    icon: '🏆',
    color: 'amber',
    endpoint: '/ai-center/calculate-trust',
    fields: [
      { key: 'entityName', label: 'Entity Name', placeholder: 'e.g., TrustCorp International' },
      { key: 'entityType', label: 'Entity Type', placeholder: 'e.g., issuer, verifier' },
      { key: 'credentials', label: 'Credentials Held', placeholder: 'e.g., ISO 27001, SOC2' },
      { key: 'history', label: 'Trust History', placeholder: 'e.g., 5 years, no incidents' },
    ],
    dataKey: 'entityData',
  },
  {
    id: 'generate-credential',
    title: 'AI Credential Generator',
    description: 'Generate W3C-compliant credential templates',
    icon: '🔮',
    color: 'purple',
    endpoint: '/ai-center/generate-credential',
    fields: [
      { key: 'credentialType', label: 'Credential Type', placeholder: 'e.g., EmploymentCredential' },
      { key: 'subjectName', label: 'Subject Name', placeholder: 'e.g., John Doe' },
      { key: 'issuerName', label: 'Issuer Name', placeholder: 'e.g., TechCorp Inc' },
      { key: 'claims', label: 'Claims to Include', placeholder: 'e.g., position, department, start_date' },
    ],
    dataKey: 'subjectData',
  },
  {
    id: 'analyze-schema',
    title: 'AI Schema Analyzer',
    description: 'Analyze credential schemas for quality and security',
    icon: '📐',
    color: 'teal',
    endpoint: '/ai-center/analyze-schema',
    fields: [
      { key: 'schemaName', label: 'Schema Name', placeholder: 'e.g., PersonIdentity' },
      { key: 'schemaType', label: 'Schema Type', placeholder: 'e.g., Identity, Education' },
      { key: 'properties', label: 'Properties', placeholder: 'e.g., name: string, dob: date' },
      { key: 'required', label: 'Required Fields', placeholder: 'e.g., name, date_of_birth' },
    ],
    dataKey: 'schemaData',
  },
  {
    id: 'privacy-advice',
    title: 'AI Privacy Advisor',
    description: 'Get privacy recommendations for credential sharing',
    icon: '🔒',
    color: 'violet',
    endpoint: '/ai-center/privacy-advice',
    fields: [
      { key: 'purpose', label: 'Sharing Purpose', placeholder: 'e.g., employment verification' },
      { key: 'recipient', label: 'Recipient', placeholder: 'e.g., HR department, bank' },
      { key: 'dataTypes', label: 'Data Being Shared', placeholder: 'e.g., name, degree, GPA' },
      { key: 'jurisdiction', label: 'Jurisdiction', placeholder: 'e.g., EU, US, Global' },
    ],
    dataKey: 'sharingContext',
  },
  {
    id: 'detect-anomalies',
    title: 'AI Anomaly Detector',
    description: 'Detect anomalies in audit logs and system activity',
    icon: '🔬',
    color: 'pink',
    endpoint: '/ai-center/detect-anomalies',
    fields: [],
    dataKey: null,
    noInput: true,
  },
  {
    id: 'dashboard-summary',
    title: 'AI Dashboard Summary',
    description: 'Get AI-powered executive summary of platform status',
    icon: '📊',
    color: 'sky',
    endpoint: '/ai-center/dashboard-summary',
    fields: [],
    dataKey: null,
    noInput: true,
  },
  {
    id: 'compliance-report',
    title: 'AI Compliance Report Export',
    description: 'Generate a PDF-ready compliance report for a framework',
    icon: '📝',
    color: 'lime',
    endpoint: '/ai/compliance-report',
    fields: [
      { key: 'framework', label: 'Framework (GDPR, eIDAS, W3C_VC)', placeholder: 'GDPR' },
    ],
    dataKey: 'framework',
    flatPayload: true,
  },
  {
    id: 'credential-batch-validate',
    title: 'AI Batch Credential Validator',
    description: 'Validate up to 50 credentials in one batch',
    icon: '📦',
    color: 'emerald',
    endpoint: '/ai/credential-batch-validate',
    fields: [
      { key: 'credential_ids', label: 'Credential IDs (comma-separated)', placeholder: '1,2,3,4' },
    ],
    dataKey: 'credential_ids',
    csvIds: true,
  },
  {
    id: 'identity-risk-report',
    title: 'AI Identity Risk Report',
    description: 'Generate a comprehensive risk narrative for one identity',
    icon: '🛡️',
    color: 'orange',
    endpoint: '/ai/identity-risk-report',
    fields: [
      { key: 'identity_id', label: 'Identity ID', placeholder: '1' },
    ],
    dataKey: 'identity_id',
    flatPayload: true,
  },
  {
    id: 'revocation-impact',
    title: 'AI Revocation Impact',
    description: 'Predict downstream impact of revoking a credential',
    icon: '🛑',
    color: 'red',
    endpoint: '/ai/revocation-impact',
    fields: [
      { key: 'credential_id', label: 'Credential ID', placeholder: '1' },
    ],
    dataKey: 'credential_id',
    flatPayload: true,
  },
  {
    id: 'credential-chain-analyzer',
    title: 'AI Credential Chain Analyzer',
    description: 'Analyze the credential chain rooted at a DID / issuer',
    icon: '🔗',
    color: 'cyan',
    endpoint: '/ai/credential-chain-analyzer',
    fields: [
      { key: 'did_uri', label: 'DID URI (or leave blank to use Issuer)', placeholder: 'did:key:z6Mkh...' },
      { key: 'issuer', label: 'Issuer (used if DID URI blank)', placeholder: 'did:web:mit.edu' },
    ],
    dataKey: 'anchorData',
    flatPayload: true,
  },
  // ---------- Apply pass 5 — additive backlog tiles ----------
  {
    id: 'issuer-workflow',
    title: 'Issuer Workflow',
    description: 'Drive issuance state machine (draft → review → approved)',
    icon: '📜',
    color: 'indigo',
    endpoint: '/ai/issuer-workflow',
    fields: [
      { key: 'credential_id', label: 'Credential ID', placeholder: '1' },
      { key: 'action', label: 'Action (create | transition)', placeholder: 'create' },
      { key: 'target_state', label: 'Target state (only for transition)', placeholder: 'review' },
    ],
    dataKey: 'workflow',
    flatPayload: true,
  },
  {
    id: 'verifier-workflow',
    title: 'Verifier Workflow',
    description: 'Record a verification outcome (pass/fail) and get follow-up advice',
    icon: '✅',
    color: 'emerald',
    endpoint: '/ai/verifier-workflow',
    fields: [
      { key: 'credential_id', label: 'Credential ID', placeholder: '1' },
      { key: 'presentation_id', label: 'Presentation ID (optional)', placeholder: '' },
      { key: 'outcome', label: 'Outcome (pass | fail)', placeholder: 'pass' },
    ],
    dataKey: 'workflow',
    flatPayload: true,
  },
  {
    id: 'selective-disclosure',
    title: 'Selective Disclosure (simulated)',
    description: 'Plan a ZKP/SD-JWT-style selective disclosure (simulated only)',
    icon: '🪪',
    color: 'cyan',
    endpoint: '/ai/selective-disclosure',
    fields: [
      { key: 'credential_id', label: 'Credential ID', placeholder: '1' },
      { key: 'purpose', label: 'Purpose', placeholder: 'age verification' },
      { key: 'requested_fields', label: 'Requested fields (comma-separated)', placeholder: 'name,age' },
    ],
    dataKey: 'plan_text',
    flatPayload: true,
  },
  {
    id: 'blockchain-anchor',
    title: 'Blockchain Anchor (simulated)',
    description: 'Plan an on-chain anchor for a credential. NEEDS-CREDS: BLOCKCHAIN_RPC_URL.',
    icon: '⛓️',
    color: 'orange',
    endpoint: '/ai/blockchain-anchor',
    fields: [
      { key: 'credential_id', label: 'Credential ID', placeholder: '1' },
    ],
    dataKey: 'plan_text',
    flatPayload: true,
  },
  {
    id: 'status-list-check',
    title: 'Status-List Check (simulated)',
    description: 'Check W3C StatusList2021 entry for a credential. NEEDS-CREDS: STATUS_LIST_PROVIDER_URL.',
    icon: '📊',
    color: 'red',
    endpoint: '/ai/status-list-check',
    fields: [
      { key: 'credential_id', label: 'Credential ID', placeholder: '1' },
    ],
    dataKey: 'report',
    flatPayload: true,
  },
];

const colorMap = {
  indigo: 'from-indigo-500/20 to-indigo-900/20 border-indigo-500/30 hover:border-indigo-400/50',
  emerald: 'from-emerald-500/20 to-emerald-900/20 border-emerald-500/30 hover:border-emerald-400/50',
  orange: 'from-orange-500/20 to-orange-900/20 border-orange-500/30 hover:border-orange-400/50',
  red: 'from-red-500/20 to-red-900/20 border-red-500/30 hover:border-red-400/50',
  lime: 'from-lime-500/20 to-lime-900/20 border-lime-500/30 hover:border-lime-400/50',
  cyan: 'from-cyan-500/20 to-cyan-900/20 border-cyan-500/30 hover:border-cyan-400/50',
  amber: 'from-amber-500/20 to-amber-900/20 border-amber-500/30 hover:border-amber-400/50',
  purple: 'from-purple-500/20 to-purple-900/20 border-purple-500/30 hover:border-purple-400/50',
  teal: 'from-teal-500/20 to-teal-900/20 border-teal-500/30 hover:border-teal-400/50',
  violet: 'from-violet-500/20 to-violet-900/20 border-violet-500/30 hover:border-violet-400/50',
  pink: 'from-pink-500/20 to-pink-900/20 border-pink-500/30 hover:border-pink-400/50',
  sky: 'from-sky-500/20 to-sky-900/20 border-sky-500/30 hover:border-sky-400/50',
};

export default function AICenter() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSelectFeature = (feature) => {
    setSelectedFeature(feature);
    setFormData({});
    setAiResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFeature) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      let payload;
      if (selectedFeature.noInput) {
        payload = {};
      } else if (selectedFeature.csvIds) {
        // Convert CSV string -> array of integers (e.g., for credential-batch-validate)
        const raw = formData[selectedFeature.dataKey] || '';
        const ids = raw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        payload = { [selectedFeature.dataKey]: ids };
      } else if (selectedFeature.flatPayload) {
        // Each field becomes a top-level key (with int coercion for *_id fields)
        payload = {};
        for (const f of selectedFeature.fields) {
          const v = formData[f.key];
          payload[f.key] = (f.key.endsWith('_id') && v) ? parseInt(v) : v;
        }
      } else if (selectedFeature.dataKey === 'subjectData') {
        payload = { credentialType: formData.credentialType, subjectData: formData };
      } else if (selectedFeature.dataKey === 'entityData' && selectedFeature.id === 'check-compliance') {
        payload = { entityData: formData, framework: formData.framework };
      } else if (selectedFeature.dataKey === 'entityData' && selectedFeature.id === 'assess-risk') {
        payload = { entityData: formData, entityType: formData.entityType };
      } else {
        payload = { [selectedFeature.dataKey]: formData };
      }
      const result = await apiPost(selectedFeature.endpoint, payload);
      // aiNew endpoints return content under .report or .validation_report or .risk_report
      const analysis = result.analysis
        || (result.report && { content: result.report, model: result.ai_response?.model, usage: result.ai_response?.usage })
        || (result.validation_report && { content: result.validation_report, model: result.ai_response?.model, usage: result.ai_response?.usage })
        || (result.risk_report && { content: result.risk_report, model: result.ai_response?.model, usage: result.ai_response?.usage })
        || { content: JSON.stringify(result, null, 2) };
      setAiResult(analysis);
    } catch (err) {
      setAiResult({ content: 'Failed to get AI analysis. Please check your OpenRouter API key in .env file.' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          AI Center
        </h1>
        <p className="text-slate-400 text-sm mt-2">All AI-powered features powered by OpenRouter</p>
      </div>

      {/* Feature Grid */}
      {!selectedFeature ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiFeatures.map(feature => (
            <button
              key={feature.id}
              onClick={() => handleSelectFeature(feature)}
              className={`bg-gradient-to-br ${colorMap[feature.color]} border rounded-2xl p-5 text-left transition hover:scale-[1.01] group`}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div>
          {/* Back button */}
          <button onClick={() => setSelectedFeature(null)}
            className="mb-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to AI Features
          </button>

          {/* Selected Feature */}
          <div className={`bg-gradient-to-br ${colorMap[selectedFeature.color]} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedFeature.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedFeature.title}</h2>
                <p className="text-slate-400 text-sm">{selectedFeature.description}</p>
              </div>
            </div>

            {selectedFeature.noInput ? (
              <div className="mb-4">
                <p className="text-slate-300 text-sm mb-4">This feature analyzes existing platform data automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {selectedFeature.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={formData[field.key] || ''}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={aiLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center gap-2"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run AI Analysis
                </>
              )}
            </button>
          </div>

          {/* AI Result */}
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      )}
    </div>
  );
}
