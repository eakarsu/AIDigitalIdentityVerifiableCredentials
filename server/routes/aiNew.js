const express = require('express');
const { callOpenRouter } = require('../openrouter');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

/**
 * POST /api/ai/compliance-report
 * Accepts { framework: 'GDPR' | 'eIDAS' | 'W3C_VC' }
 * Fetches all compliance_checks for that framework, batches through AI compliance checker,
 * generates PDF-ready structured report.
 */
router.post('/compliance-report', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { framework } = req.body;
    const validFrameworks = ['GDPR', 'eIDAS', 'W3C_VC'];
    if (!framework) return res.status(400).json({ error: 'framework is required (GDPR, eIDAS, or W3C_VC)' });
    if (!validFrameworks.includes(framework)) {
      return res.status(400).json({ error: `framework must be one of: ${validFrameworks.join(', ')}` });
    }

    const checksResult = await pool.query(
      `SELECT * FROM compliance_checks WHERE framework = $1 ORDER BY created_at DESC`,
      [framework]
    );
    const checks = checksResult.rows;

    if (checks.length === 0) {
      return res.status(404).json({ error: `No compliance checks found for framework: ${framework}` });
    }

    const passed = checks.filter(c => c.status === 'passed').length;
    const failed = checks.filter(c => c.status === 'failed').length;
    const pending = checks.filter(c => c.status === 'pending').length;

    const prompt = `You are a compliance expert specializing in digital identity frameworks. Generate a comprehensive, PDF-ready compliance report for the ${framework} framework.

COMPLIANCE CHECKS SUMMARY:
Framework: ${framework}
Total Checks: ${checks.length}
Passed: ${passed} | Failed: ${failed} | Pending: ${pending}
Compliance Rate: ${Math.round((passed / checks.length) * 100)}%

DETAILED FINDINGS:
${checks.map(c => `
Check: ${c.check_name}
Entity Type: ${c.entity_type} | Entity ID: ${c.entity_id}
Status: ${c.status}
Findings: ${JSON.stringify(c.findings)}
Date: ${c.checked_at}
`).join('\n---\n')}

Generate a structured compliance report with:
1. Executive Summary
   - Overall Compliance Score
   - Critical Issues Count
   - Compliance Status (Compliant/Partially Compliant/Non-Compliant)
2. Framework Overview (${framework} requirements)
3. Gap Analysis
   - Failed Checks Details
   - Root Cause Analysis
4. Risk Assessment
   - Business Impact of Gaps
   - Regulatory Risk Level
5. Remediation Priorities (High/Medium/Low with specific actions)
6. Timeline for Remediation
7. Recommendations for Maintaining Compliance
8. Conclusion and Next Review Date`;

    const result = await callOpenRouter(prompt, `You are a compliance expert specializing in ${framework} for digital identity systems. Generate detailed, actionable compliance reports.`);

    res.json({
      framework,
      summary: {
        total_checks: checks.length,
        passed,
        failed,
        pending,
        compliance_rate_percent: Math.round((passed / checks.length) * 100)
      },
      report: result.content,
      generated_at: new Date().toISOString(),
      ai_response: {
        model: result.model,
        usage: result.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/credential-batch-validate
 * Accepts { credential_ids: number[] }
 * Fetches each credential, validates each via AI, returns bulk validation report.
 */
router.post('/credential-batch-validate', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { credential_ids } = req.body;
    if (!credential_ids || !Array.isArray(credential_ids) || credential_ids.length === 0) {
      return res.status(400).json({ error: 'credential_ids must be a non-empty array' });
    }
    if (credential_ids.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 credentials per batch request' });
    }

    // Fetch all credentials
    const placeholders = credential_ids.map((_, i) => `$${i + 1}`).join(', ');
    const credsResult = await pool.query(
      `SELECT * FROM verifiable_credentials WHERE id IN (${placeholders})`,
      credential_ids
    );
    const credentials = credsResult.rows;

    if (credentials.length === 0) {
      return res.status(404).json({ error: 'No credentials found for given IDs' });
    }

    const prompt = `You are a verifiable credential validation expert. Perform batch validation of the following ${credentials.length} credentials. For each credential, provide a structured validation result.

CREDENTIALS TO VALIDATE:
${credentials.map((c, idx) => `
[${idx + 1}] ID: ${c.id}
Type: ${c.credential_type}
Issuer: ${c.issuer}
Subject: ${c.subject}
Issuance Date: ${c.issuance_date}
Expiration Date: ${c.expiration_date || 'No expiration'}
Status: ${c.status}
Credential Data: ${JSON.stringify(c.credential_data)}
Proof: ${JSON.stringify(c.proof)}
`).join('\n---\n')}

For EACH credential provide:
1. Credential ID
2. Validation Result: PASS / FAIL / WARNING
3. Validity Score (0-100)
4. Issues Found (list any problems)
5. W3C VC Compliance Status
6. Expiration Check
7. Issuer Trust Assessment
8. Recommendations

Then provide an overall BATCH SUMMARY with:
- Total: ${credentials.length}
- Pass Count / Fail Count / Warning Count
- Critical Issues Requiring Immediate Action
- Overall Data Quality Assessment`;

    const result = await callOpenRouter(prompt, 'You are a verifiable credential validation expert specializing in W3C VC Data Model compliance and credential integrity.');

    // Quick local checks for pass/fail/warning counts from the report
    const reportText = result.content || '';
    const passCount = (reportText.match(/\bPASS\b/gi) || []).length;
    const failCount = (reportText.match(/\bFAIL\b/gi) || []).length;
    const warnCount = (reportText.match(/\bWARNING\b/gi) || []).length;

    res.json({
      batch_size: credentials.length,
      credentials_found: credentials.length,
      credentials_requested: credential_ids.length,
      summary: {
        pass: passCount,
        fail: failCount,
        warning: warnCount
      },
      validation_report: result.content,
      generated_at: new Date().toISOString(),
      ai_response: {
        model: result.model,
        usage: result.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/identity-risk-report
 * Accepts { identity_id }
 * Fetches identity + all linked verifications + audit logs + risk assessments,
 * generates comprehensive risk narrative.
 */
router.post('/identity-risk-report', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { identity_id } = req.body;
    if (!identity_id) return res.status(400).json({ error: 'identity_id is required' });

    // Fetch identity
    const identityResult = await pool.query(
      'SELECT * FROM digital_identities WHERE id = $1',
      [identity_id]
    );
    if (identityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Digital identity not found' });
    }
    const identity = identityResult.rows[0];

    // Fetch linked verifications
    const verificationsResult = await pool.query(
      'SELECT * FROM identity_verifications WHERE identity_id = $1 ORDER BY created_at DESC',
      [identity_id]
    );

    // Fetch audit logs for this entity
    const auditResult = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type = 'digital_identity' AND entity_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [identity_id]
    );

    // Fetch risk assessments for this entity
    const riskResult = await pool.query(
      `SELECT * FROM risk_assessments WHERE entity_type = 'digital_identity' AND entity_id = $1 ORDER BY created_at DESC`,
      [identity_id]
    );

    // Fetch fraud alerts
    const fraudResult = await pool.query(
      `SELECT * FROM fraud_alerts WHERE entity_type = 'digital_identity' AND entity_id = $1 ORDER BY created_at DESC`,
      [identity_id]
    );

    const prompt = `You are a digital identity risk analyst. Generate a comprehensive risk narrative for the following digital identity, incorporating all available data.

IDENTITY PROFILE:
ID: ${identity.id}
Name: ${identity.identity_name}
Type: ${identity.identity_type}
Status: ${identity.status}
AI Trust Score: ${identity.ai_trust_score || 'Not assessed'}
Metadata: ${JSON.stringify(identity.metadata)}
Created: ${identity.created_at}

IDENTITY VERIFICATIONS (${verificationsResult.rows.length} total):
${verificationsResult.rows.map(v => `- [${v.verified_at}] Type: ${v.verification_type} | Method: ${v.verification_method} | Result: ${v.result} | Confidence: ${v.confidence_score}%`).join('\n') || 'No verifications on record'}

RISK ASSESSMENTS (${riskResult.rows.length} total):
${riskResult.rows.map(r => `- Risk Level: ${r.risk_level} | Score: ${r.risk_score} | Factors: ${JSON.stringify(r.risk_factors)} | Date: ${r.assessed_at}`).join('\n') || 'No risk assessments on record'}

FRAUD ALERTS (${fraudResult.rows.length} total):
${fraudResult.rows.map(f => `- [${f.severity.toUpperCase()}] ${f.alert_type}: ${f.description} | Status: ${f.status} | Date: ${f.created_at}`).join('\n') || 'No fraud alerts'}

AUDIT LOG ACTIVITY (${auditResult.rows.length} events):
${auditResult.rows.slice(0, 20).map(a => `- [${a.created_at}] ${a.action} by ${a.actor} | Anomaly: ${a.ai_anomaly_flag ? 'YES' : 'No'}`).join('\n') || 'No audit events'}

Generate a comprehensive risk narrative including:
1. Identity Risk Executive Summary
2. Trust Score Interpretation and Trend
3. Verification History Analysis
   - Successful vs Failed Verifications
   - Confidence Score Trends
4. Risk Profile Evolution
   - Historical Risk Levels
   - Risk Factor Analysis
5. Behavioral Analysis (from audit logs)
   - Access Patterns
   - Anomalous Activity
6. Fraud Indicator Assessment
7. Compliance Posture
8. Overall Risk Rating (Critical/High/Medium/Low) with justification
9. Recommended Actions (prioritized)
10. Monitoring Recommendations`;

    const result = await callOpenRouter(prompt, 'You are a digital identity security and risk analyst. Generate thorough, evidence-based risk narratives.');

    res.json({
      identity_id,
      identity_name: identity.identity_name,
      data_sources: {
        verifications: verificationsResult.rows.length,
        risk_assessments: riskResult.rows.length,
        fraud_alerts: fraudResult.rows.length,
        audit_events: auditResult.rows.length
      },
      risk_report: result.content,
      generated_at: new Date().toISOString(),
      ai_response: {
        model: result.model,
        usage: result.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/revocation-impact
 * Accepts { credential_id }
 * Predicts the downstream impact of revoking a credential by inspecting the
 * credential, its shares, related presentations, and the trust registry.
 */
router.post('/revocation-impact', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { credential_id } = req.body;
    if (!credential_id) return res.status(400).json({ error: 'credential_id is required' });

    const credResult = await pool.query(
      'SELECT * FROM verifiable_credentials WHERE id = $1',
      [credential_id]
    );
    if (credResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }
    const credential = credResult.rows[0];

    // Best-effort related data fetches (defensive against schema variance)
    let shares = [];
    let presentations = [];
    let revocations = [];
    let trustEntries = [];
    try {
      const sharesRes = await pool.query(
        'SELECT * FROM credential_shares WHERE credential_id = $1 ORDER BY created_at DESC LIMIT 50',
        [credential_id]
      );
      shares = sharesRes.rows;
    } catch (_) {}
    try {
      const presRes = await pool.query(
        `SELECT * FROM presentation_requests WHERE requested_credentials::text LIKE $1 ORDER BY created_at DESC LIMIT 50`,
        [`%${credential.credential_type}%`]
      );
      presentations = presRes.rows;
    } catch (_) {}
    try {
      const revRes = await pool.query(
        'SELECT * FROM revocation_entries WHERE credential_id = $1 ORDER BY created_at DESC',
        [credential_id]
      );
      revocations = revRes.rows;
    } catch (_) {}
    try {
      const trustRes = await pool.query(
        `SELECT * FROM trust_registry WHERE entity_name = $1 LIMIT 5`,
        [credential.issuer]
      );
      trustEntries = trustRes.rows;
    } catch (_) {}

    const prompt = `You are a verifiable credential lifecycle analyst. Predict the downstream impact of revoking the following credential.

CREDENTIAL UNDER REVIEW:
ID: ${credential.id}
Type: ${credential.credential_type}
Issuer: ${credential.issuer}
Subject: ${credential.subject}
Issuance Date: ${credential.issuance_date}
Expiration Date: ${credential.expiration_date || 'No expiration'}
Status: ${credential.status}

CREDENTIAL SHARES (${shares.length}):
${shares.map(s => `- Shared with: ${s.shared_with} | Purpose: ${s.purpose} | Date: ${s.created_at}`).join('\n') || 'No share records'}

RELATED PRESENTATION REQUESTS (${presentations.length}):
${presentations.map(p => `- Verifier: ${p.verifier} | Purpose: ${p.purpose} | Status: ${p.status}`).join('\n') || 'No presentation requests'}

EXISTING REVOCATIONS (${revocations.length}):
${revocations.map(r => `- Reason: ${r.reason} | Revoked By: ${r.revoked_by} | Date: ${r.created_at}`).join('\n') || 'No prior revocations'}

ISSUER TRUST REGISTRY (${trustEntries.length}):
${trustEntries.map(t => `- Trust Level: ${t.trust_level} | Framework: ${t.governance_framework}`).join('\n') || 'No trust registry entries'}

Provide a structured Revocation Impact Analysis including:
1. Affected Verifiers and Relying Parties
2. Active Sessions / Presentations at Risk
3. Cascading Trust Implications
4. Subject Impact (loss of access / privileges)
5. Issuer Reputational Impact
6. Compliance & Audit Implications
7. Recommended Pre-Revocation Communication Plan
8. Recommended Post-Revocation Monitoring
9. Overall Impact Severity (Low / Medium / High / Critical) with justification`;

    const result = await callOpenRouter(prompt, 'You are an expert in verifiable credential lifecycle and revocation impact analysis.');

    res.json({
      credential_id,
      credential_type: credential.credential_type,
      issuer: credential.issuer,
      data_sources: {
        shares: shares.length,
        presentations: presentations.length,
        prior_revocations: revocations.length,
        trust_entries: trustEntries.length
      },
      report: result.content,
      generated_at: new Date().toISOString(),
      ai_response: { model: result.model, usage: result.usage }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/credential-chain-analyzer
 * Accepts { did_uri } or { issuer }
 * Analyzes the credential chain rooted at a DID / issuer:
 * its DID document, issued credentials, and trust registry posture.
 */
router.post('/credential-chain-analyzer', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { did_uri, issuer } = req.body;
    const anchor = did_uri || issuer;
    if (!anchor) {
      return res.status(400).json({ error: 'did_uri or issuer is required' });
    }

    let didDoc = null;
    let issuedCreds = [];
    let trustEntries = [];
    let revocations = [];
    try {
      const didRes = await pool.query(
        'SELECT * FROM did_documents WHERE did_uri = $1 LIMIT 1',
        [anchor]
      );
      didDoc = didRes.rows[0] || null;
    } catch (_) {}
    try {
      const credsRes = await pool.query(
        'SELECT * FROM verifiable_credentials WHERE issuer = $1 ORDER BY issuance_date DESC LIMIT 100',
        [anchor]
      );
      issuedCreds = credsRes.rows;
    } catch (_) {}
    try {
      const trustRes = await pool.query(
        'SELECT * FROM trust_registry WHERE entity_name = $1 LIMIT 5',
        [anchor]
      );
      trustEntries = trustRes.rows;
    } catch (_) {}
    try {
      if (issuedCreds.length > 0) {
        const ids = issuedCreds.slice(0, 50).map(c => c.id);
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        const revRes = await pool.query(
          `SELECT * FROM revocation_entries WHERE credential_id IN (${placeholders})`,
          ids
        );
        revocations = revRes.rows;
      }
    } catch (_) {}

    if (!didDoc && issuedCreds.length === 0 && trustEntries.length === 0) {
      return res.status(404).json({ error: `No DID document, issued credentials, or trust entries found for: ${anchor}` });
    }

    const prompt = `You are a verifiable credential chain analyst. Perform an explicit credential-chain analysis for the following anchor.

ANCHOR: ${anchor}

DID DOCUMENT:
${didDoc ? `- Method: ${didDoc.method}
- Controller: ${didDoc.controller}
- Verification Methods: ${JSON.stringify(didDoc.verification_methods)}
- Services: ${JSON.stringify(didDoc.services)}` : 'No DID document on record for this anchor.'}

ISSUED CREDENTIALS (${issuedCreds.length}, showing up to 30):
${issuedCreds.slice(0, 30).map(c => `- [${c.id}] ${c.credential_type} | Subject: ${c.subject} | Status: ${c.status} | Issued: ${c.issuance_date}${c.expiration_date ? ` | Expires: ${c.expiration_date}` : ''}`).join('\n') || 'No issued credentials.'}

REVOCATIONS AMONG ISSUED CREDENTIALS (${revocations.length}):
${revocations.map(r => `- Credential: ${r.credential_id} | Reason: ${r.reason} | Date: ${r.created_at}`).join('\n') || 'No revocations recorded.'}

TRUST REGISTRY ENTRIES (${trustEntries.length}):
${trustEntries.map(t => `- Trust Level: ${t.trust_level} | Framework: ${t.governance_framework} | Credential Types: ${JSON.stringify(t.credentials_types)}`).join('\n') || 'No trust registry entries.'}

Produce a Credential Chain Analysis covering:
1. Anchor Identity Summary
2. Cryptographic Material Assessment (verification methods, key types)
3. Issuance Footprint (volume, types, recency)
4. Revocation Posture
5. Trust Anchoring (registry alignment, governance framework)
6. Chain Integrity Risks
7. Interoperability and W3C Compliance Notes
8. Recommendations to Strengthen the Chain
9. Overall Chain Trustworthiness Rating (Low / Medium / High) with justification`;

    const result = await callOpenRouter(prompt, 'You are an expert in W3C DID, verifiable credential chains, and trust frameworks.');

    res.json({
      anchor,
      data_sources: {
        did_document: !!didDoc,
        issued_credentials: issuedCreds.length,
        revocations: revocations.length,
        trust_entries: trustEntries.length
      },
      report: result.content,
      generated_at: new Date().toISOString(),
      ai_response: { model: result.model, usage: result.usage }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================================================================
// Apply pass 5 — additive backlog endpoints (issuer/verifier workflow,
// selective-disclosure, blockchain anchoring, status-list revocation).
//
// Categories:
//   - issuer-workflow / verifier-workflow: NEEDS-PRODUCT-DECISION.
//     PRODUCT-DECISION: store workflows in a new optional table
//     `vc_workflows` (CREATE TABLE IF NOT EXISTS) and use workflow states
//     ['draft','review','approved','rejected','revoked']. Issuer flow
//     transitions via the `transition` action; verifier flow records
//     verification outcomes.
//   - selective-disclosure: NEEDS-PRODUCT-DECISION.
//     PRODUCT-DECISION: do NOT implement real ZKP cryptography in this pass;
//     produce a JSON "disclosure plan" via the LLM listing which fields to
//     disclose, which to hide, and the predicate proofs that would be needed
//     for a real ZKP layer. Marked `simulated: true`.
//   - blockchain-anchoring: NEEDS-CREDS — gates on BLOCKCHAIN_RPC_URL.
//     Without that env var we return 503 with `missing: 'BLOCKCHAIN_RPC_URL'`.
//   - status-list-check: NEEDS-CREDS — gates on
//     STATUS_LIST_PROVIDER_URL. Without it we return 503 with the missing
//     env var name. With it set, we still don't make outbound calls; we
//     simulate the check via the LLM (additive only).
//
// Required env vars (documented):
//   OPENROUTER_API_KEY — for any LLM-backed endpoint here.
//   BLOCKCHAIN_RPC_URL — for /blockchain-anchor (Ethereum/Hyperledger RPC).
//   BLOCKCHAIN_PRIVATE_KEY — for signing anchor transactions.
//   STATUS_LIST_PROVIDER_URL — for /status-list-check.
//
// Schema additions (all CREATE TABLE IF NOT EXISTS):
//   vc_workflows (id, kind, entity_id, state, history JSONB, created_at).
// ===========================================================================

let _vcWorkflowsEnsured = false;
async function ensureVcWorkflowsTable() {
  if (_vcWorkflowsEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vc_workflows (
        id SERIAL PRIMARY KEY,
        kind VARCHAR(32) NOT NULL,
        entity_id TEXT NOT NULL,
        state VARCHAR(32) NOT NULL DEFAULT 'draft',
        history JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } catch (_) { /* ignore */ }
  _vcWorkflowsEnsured = true;
}

const VALID_WF_STATES = ['draft', 'review', 'approved', 'rejected', 'revoked'];

/**
 * POST /api/ai/issuer-workflow
 * Body: { credential_id, action: 'create'|'transition', target_state? }
 * PRODUCT-DECISION: simple state machine; LLM produces issuance recommendation.
 */
router.post('/issuer-workflow', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    }
    await ensureVcWorkflowsTable();
    const { credential_id, action = 'create', target_state } = req.body || {};
    if (!credential_id) return res.status(400).json({ error: 'credential_id required' });

    let row;
    if (action === 'create') {
      const r = await pool.query(
        `INSERT INTO vc_workflows (kind, entity_id, state, history)
         VALUES ('issuer', $1, 'draft',
           jsonb_build_array(jsonb_build_object('state', 'draft', 'at', NOW())))
         RETURNING *`,
        [credential_id]
      );
      row = r.rows[0];
    } else if (action === 'transition') {
      if (!VALID_WF_STATES.includes(target_state)) {
        return res.status(400).json({ error: `target_state must be one of: ${VALID_WF_STATES.join(', ')}` });
      }
      const r = await pool.query(
        `UPDATE vc_workflows
         SET state = $1,
             history = history || jsonb_build_array(jsonb_build_object('state', $1::text, 'at', NOW())),
             updated_at = NOW()
         WHERE kind = 'issuer' AND entity_id = $2
         RETURNING *`,
        [target_state, credential_id]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'workflow not found' });
      row = r.rows[0];
    } else {
      return res.status(400).json({ error: 'action must be create|transition' });
    }

    const prompt = `You are an issuer-workflow advisor for verifiable credentials.
A credential is in workflow state "${row.state}" (history: ${JSON.stringify(row.history).slice(0, 800)}).
Recommend the next reasonable action and any blockers. Respond ONLY in JSON:
{
  "nextAction": "...",
  "rationale": "1-2 sentences",
  "blockers": ["..."]
}`;
    const ai = await callOpenRouter(prompt, 'You are a credential issuance workflow expert.');
    res.json({ workflow: row, ai_recommendation: ai.content, ai_response: { model: ai.model, usage: ai.usage } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/verifier-workflow
 * Body: { credential_id, presentation_id?, outcome?: 'pass'|'fail' }
 */
router.post('/verifier-workflow', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    }
    await ensureVcWorkflowsTable();
    const { credential_id, presentation_id = null, outcome = 'pass' } = req.body || {};
    if (!credential_id) return res.status(400).json({ error: 'credential_id required' });

    const newState = outcome === 'fail' ? 'rejected' : 'approved';
    const r = await pool.query(
      `INSERT INTO vc_workflows (kind, entity_id, state, history)
       VALUES ('verifier', $1, $2,
         jsonb_build_array(jsonb_build_object('state', $2::text, 'at', NOW(), 'presentation_id', $3::text)))
       RETURNING *`,
      [credential_id, newState, presentation_id || '']
    );

    const prompt = `You are a verifier-workflow advisor.
A verifier just recorded a "${newState}" verification of credential ${credential_id}.
Suggest follow-up actions and risks. Respond ONLY in JSON:
{ "followUp": "...", "risks": ["..."], "auditNotes": "..." }`;
    const ai = await callOpenRouter(prompt, 'You are a verifier workflow advisor.');
    res.json({ workflow: r.rows[0], ai_recommendation: ai.content, ai_response: { model: ai.model, usage: ai.usage } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/selective-disclosure
 * Body: { credential_id, requested_fields: string[], purpose?: string }
 * PRODUCT-DECISION: simulated — produces a disclosure plan, not real ZKP.
 */
router.post('/selective-disclosure', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    }
    const { credential_id, requested_fields = [], purpose = 'verification' } = req.body || {};
    if (!credential_id) return res.status(400).json({ error: 'credential_id required' });

    let credential = null;
    try {
      const r = await pool.query('SELECT * FROM verifiable_credentials WHERE id = $1', [credential_id]);
      credential = r.rows[0] || null;
    } catch (_) { /* schema variance */ }

    const allFields = credential && credential.claims ? Object.keys(
      typeof credential.claims === 'string' ? JSON.parse(credential.claims) : credential.claims
    ) : ['name', 'dob', 'address', 'role'];

    const prompt = `You are a selective-disclosure planner for verifiable credentials
(W3C VC Data Model + BBS+ / SD-JWT style, simulated only).

CREDENTIAL FIELDS: ${JSON.stringify(allFields)}
REQUESTED FIELDS: ${JSON.stringify(requested_fields)}
PURPOSE: ${purpose}

Produce a JSON disclosure plan:
{
  "discloseFields": ["..."],
  "hiddenFields": ["..."],
  "predicateProofs": [{ "field": "dob", "predicate": "age >= 18", "rationale": "..." }],
  "privacyScore": 0,
  "warnings": ["..."]
}`;
    const ai = await callOpenRouter(prompt, 'You are a selective-disclosure ZKP planner.');
    res.json({
      credential_id,
      simulated: true,
      // PRODUCT-DECISION: real ZKP would require a BBS+ / Groth16 toolkit.
      plan_text: ai.content,
      ai_response: { model: ai.model, usage: ai.usage }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/blockchain-anchor
 * Body: { credential_id }
 * NEEDS-CREDS: BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY.
 * Additive: never makes a real on-chain call; produces an LLM analysis when
 * RPC URL is set; otherwise 503 + missing.
 */
router.post('/blockchain-anchor', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    }
    if (!process.env.BLOCKCHAIN_RPC_URL) {
      return res.status(503).json({ error: 'Blockchain anchoring not configured', missing: 'BLOCKCHAIN_RPC_URL' });
    }
    const { credential_id } = req.body || {};
    if (!credential_id) return res.status(400).json({ error: 'credential_id required' });

    let cred = null;
    try {
      const r = await pool.query('SELECT * FROM verifiable_credentials WHERE id = $1', [credential_id]);
      cred = r.rows[0] || null;
    } catch (_) {}

    const prompt = `You are a blockchain-anchor planner for VCs.
Plan an on-chain anchor for credential ${credential_id} (rpc=${process.env.BLOCKCHAIN_RPC_URL}).
${cred ? 'CRED SUMMARY: ' + JSON.stringify({ id: cred.id, type: cred.credential_type, issuer: cred.issuer_id }) : 'No credential row available.'}
Respond ONLY in JSON:
{
  "chain": "ethereum|hyperledger|polygon",
  "method": "merkleRoot|hashAnchor",
  "estimatedGas": 0,
  "rationale": "1-2 sentences",
  "simulatedTxHash": "0x..."
}`;
    const ai = await callOpenRouter(prompt, 'You are a blockchain-anchor planner.');
    res.json({
      credential_id,
      simulated: true,
      rpc_configured: true,
      plan_text: ai.content,
      ai_response: { model: ai.model, usage: ai.usage }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/status-list-check
 * Body: { credential_id }
 * NEEDS-CREDS: STATUS_LIST_PROVIDER_URL.
 */
router.post('/status-list-check', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable', missing: 'OPENROUTER_API_KEY' });
    }
    if (!process.env.STATUS_LIST_PROVIDER_URL) {
      return res.status(503).json({ error: 'Status list provider not configured', missing: 'STATUS_LIST_PROVIDER_URL' });
    }
    const { credential_id } = req.body || {};
    if (!credential_id) return res.status(400).json({ error: 'credential_id required' });

    let revoked = false;
    try {
      const r = await pool.query(
        'SELECT 1 FROM revocation_entries WHERE credential_id = $1 LIMIT 1',
        [credential_id]
      );
      revoked = r.rows.length > 0;
    } catch (_) {}

    const prompt = `You are a status-list verifier (W3C StatusList2021, simulated).
Provider: ${process.env.STATUS_LIST_PROVIDER_URL}
Local revocation hit: ${revoked}
Respond ONLY in JSON:
{ "status": "active|revoked|suspended", "narrative": "1-2 sentences" }`;
    const ai = await callOpenRouter(prompt, 'You are a status-list verifier.');
    res.json({
      credential_id,
      provider: process.env.STATUS_LIST_PROVIDER_URL,
      simulated: true,
      local_revocation: revoked,
      report: ai.content,
      ai_response: { model: ai.model, usage: ai.usage }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
