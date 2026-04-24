const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const aiCenterRoutes = require('./routes/ai-center');
const createCrudRouter = require('./routes/crud');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth routes (no auth required)
app.use('/api/auth', authRoutes);

// AI Center routes
app.use('/api/ai-center', aiCenterRoutes);

// Feature CRUD routes with AI integration
app.use('/api/digital-identities', createCrudRouter('digital_identities', (item) =>
  `Analyze this digital identity for security, trust, and compliance. Identity: ${item.identity_name}, Type: ${item.identity_type}, Status: ${item.status}, Trust Score: ${item.ai_trust_score}, Metadata: ${JSON.stringify(item.metadata)}. Provide security assessment, trust evaluation, and recommendations.`,
  'Digital Identity'
));

app.use('/api/did-documents', createCrudRouter('did_documents', (item) =>
  `Analyze this DID Document: URI: ${item.did_uri}, Method: ${item.method}, Controller: ${item.controller}, Verification Methods: ${JSON.stringify(item.verification_methods)}, Services: ${JSON.stringify(item.services)}. Assess W3C DID Core compliance, security posture, and interoperability.`,
  'DID Document'
));

app.use('/api/verifiable-credentials', createCrudRouter('verifiable_credentials', (item) =>
  `Analyze this Verifiable Credential: Type: ${item.credential_type}, Issuer: ${item.issuer}, Subject: ${item.subject}, Data: ${JSON.stringify(item.credential_data)}, Status: ${item.status}. Assess validity, issuer trust, data integrity, and compliance with W3C VC Data Model.`,
  'Verifiable Credential'
));

app.use('/api/identity-verifications', createCrudRouter('identity_verifications', (item) =>
  `Analyze this identity verification result: Type: ${item.verification_type}, Method: ${item.verification_method}, Result: ${item.result}, Confidence: ${item.confidence_score}%, Details: ${JSON.stringify(item.details)}. Assess reliability, suggest improvements, and identify potential weaknesses.`,
  'Identity Verification'
));

app.use('/api/credential-templates', createCrudRouter('credential_templates', (item) =>
  `Analyze this credential template: Name: ${item.template_name}, Type: ${item.template_type}, Schema: ${JSON.stringify(item.schema_definition)}, AI Generated: ${item.ai_generated}. Assess completeness, security, usability, and suggest improvements.`,
  'Credential Template'
));

app.use('/api/trust-registry', createCrudRouter('trust_registry', (item) =>
  `Analyze this trust registry entry: Entity: ${item.entity_name}, Type: ${item.entity_type}, Trust Level: ${item.trust_level}, Framework: ${item.governance_framework}, Credential Types: ${JSON.stringify(item.credentials_types)}. Assess trustworthiness, governance alignment, and provide recommendations.`,
  'Trust Registry Entry'
));

app.use('/api/credential-schemas', createCrudRouter('credential_schemas', (item) =>
  `Analyze this credential schema: Name: ${item.schema_name}, Version: ${item.schema_version}, Type: ${item.schema_type}, Properties: ${JSON.stringify(item.properties)}, Required: ${JSON.stringify(item.required_fields)}. Assess completeness, data minimization, interoperability, and security.`,
  'Credential Schema'
));

app.use('/api/revocation-entries', createCrudRouter('revocation_entries', (item) =>
  `Analyze this credential revocation: Credential ID: ${item.credential_id}, Reason: ${item.reason}, Revoked By: ${item.revoked_by}. Assess the revocation process, implications, and provide guidance on revocation best practices.`,
  'Revocation Entry'
));

app.use('/api/risk-assessments', createCrudRouter('risk_assessments', (item) =>
  `Analyze this risk assessment: Entity Type: ${item.entity_type}, Risk Level: ${item.risk_level}, Risk Score: ${item.risk_score}, Factors: ${JSON.stringify(item.risk_factors)}, Recommendations: ${JSON.stringify(item.recommendations)}. Provide deeper risk analysis and additional mitigation strategies.`,
  'Risk Assessment'
));

app.use('/api/compliance-checks', createCrudRouter('compliance_checks', (item) =>
  `Analyze this compliance check: Name: ${item.check_name}, Framework: ${item.framework}, Status: ${item.status}, Findings: ${JSON.stringify(item.findings)}. Provide detailed compliance analysis, remediation steps, and best practices.`,
  'Compliance Check'
));

app.use('/api/fraud-alerts', createCrudRouter('fraud_alerts', (item) =>
  `Analyze this fraud alert: Type: ${item.alert_type}, Severity: ${item.severity}, Description: ${item.description}, Indicators: ${JSON.stringify(item.indicators)}, Status: ${item.status}. Provide investigation guidance, pattern analysis, and prevention recommendations.`,
  'Fraud Alert'
));

app.use('/api/credential-shares', createCrudRouter('credential_shares', (item) =>
  `Analyze this credential sharing activity: Shared with: ${item.shared_with}, Purpose: ${item.purpose}, Disclosed Fields: ${JSON.stringify(item.disclosed_fields)}, Policy: ${JSON.stringify(item.access_policy)}. Assess privacy implications, selective disclosure effectiveness, and security.`,
  'Credential Share'
));

app.use('/api/presentation-requests', createCrudRouter('presentation_requests', (item) =>
  `Analyze this presentation request: Verifier: ${item.verifier}, Purpose: ${item.purpose}, Requested: ${JSON.stringify(item.requested_credentials)}, Constraints: ${JSON.stringify(item.constraints)}, Status: ${item.status}. Assess legitimacy, privacy implications, and suggest optimal response strategy.`,
  'Presentation Request'
));

app.use('/api/audit-logs', createCrudRouter('audit_logs', (item) =>
  `Analyze this audit log entry: Action: ${item.action}, Entity: ${item.entity_type}, Actor: ${item.actor}, Details: ${JSON.stringify(item.details)}, Anomaly: ${item.ai_anomaly_flag}. Assess security implications and identify patterns.`,
  'Audit Log'
));

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  const pool = require('./db');
  try {
    const [identities, credentials, dids, verifications, templates, trust, schemas, revocations, risks, compliance, fraud, shares, presentations, audits] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as count FROM digital_identities'),
      pool.query('SELECT COUNT(*)::int as count FROM verifiable_credentials'),
      pool.query('SELECT COUNT(*)::int as count FROM did_documents'),
      pool.query('SELECT COUNT(*)::int as count FROM identity_verifications'),
      pool.query('SELECT COUNT(*)::int as count FROM credential_templates'),
      pool.query('SELECT COUNT(*)::int as count FROM trust_registry'),
      pool.query('SELECT COUNT(*)::int as count FROM credential_schemas'),
      pool.query('SELECT COUNT(*)::int as count FROM revocation_entries'),
      pool.query('SELECT COUNT(*)::int as count FROM risk_assessments'),
      pool.query('SELECT COUNT(*)::int as count FROM compliance_checks'),
      pool.query('SELECT COUNT(*)::int as count FROM fraud_alerts'),
      pool.query('SELECT COUNT(*)::int as count FROM credential_shares'),
      pool.query('SELECT COUNT(*)::int as count FROM presentation_requests'),
      pool.query('SELECT COUNT(*)::int as count FROM audit_logs')
    ]);
    res.json({
      digital_identities: identities.rows[0].count,
      verifiable_credentials: credentials.rows[0].count,
      did_documents: dids.rows[0].count,
      identity_verifications: verifications.rows[0].count,
      credential_templates: templates.rows[0].count,
      trust_registry: trust.rows[0].count,
      credential_schemas: schemas.rows[0].count,
      revocation_entries: revocations.rows[0].count,
      risk_assessments: risks.rows[0].count,
      compliance_checks: compliance.rows[0].count,
      fraud_alerts: fraud.rows[0].count,
      credential_shares: shares.rows[0].count,
      presentation_requests: presentations.rows[0].count,
      audit_logs: audits.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔐 AI Digital Identity Server running on port ${PORT}`);
});
