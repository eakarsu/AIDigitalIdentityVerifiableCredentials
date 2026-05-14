const express = require('express');
const { callOpenRouter } = require('../openrouter');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// AI Identity Verification
router.post('/verify-identity', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { identityData } = req.body;
    const prompt = `Analyze this digital identity for verification. Assess authenticity, completeness, and risk factors. Provide a verification score (0-100), detailed findings, and recommendations.

Identity Data: ${JSON.stringify(identityData)}

Provide structured analysis with:
1. Verification Score (0-100)
2. Authentication Assessment
3. Document Integrity Check
4. Risk Indicators
5. Recommendations
6. Trust Level (Low/Medium/High/Very High)`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Credential Validator
router.post('/validate-credential', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { credentialData } = req.body;
    const prompt = `Validate this verifiable credential. Check for compliance with W3C VC Data Model, assess the issuer trustworthiness, and verify credential integrity.

Credential Data: ${JSON.stringify(credentialData)}

Provide structured validation with:
1. Validity Score (0-100)
2. W3C Compliance Check
3. Issuer Trust Assessment
4. Credential Integrity
5. Expiration Status
6. Potential Issues
7. Recommendations`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Risk Assessment
router.post('/assess-risk', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { entityData, entityType } = req.body;
    const prompt = `Perform a comprehensive risk assessment for this ${entityType || 'entity'} in the context of digital identity and verifiable credentials.

Entity Data: ${JSON.stringify(entityData)}

Provide:
1. Overall Risk Score (0-100)
2. Risk Level (Critical/High/Medium/Low)
3. Risk Factors Identified
4. Threat Vectors
5. Vulnerability Assessment
6. Mitigation Strategies
7. Compliance Impact
8. Recommended Actions (prioritized)`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Fraud Detection
router.post('/detect-fraud', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { transactionData } = req.body;
    const prompt = `Analyze this digital identity/credential transaction for potential fraud indicators. Apply advanced fraud detection heuristics.

Transaction Data: ${JSON.stringify(transactionData)}

Provide:
1. Fraud Probability Score (0-100)
2. Fraud Type Classification
3. Suspicious Indicators
4. Pattern Analysis
5. Behavioral Anomalies
6. Network Analysis
7. Recommended Actions
8. False Positive Assessment`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Compliance Checker
router.post('/check-compliance', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { entityData, framework } = req.body;
    const prompt = `Perform a compliance check for this entity against the ${framework || 'GDPR, eIDAS, and W3C VC'} framework(s) in the context of digital identity and verifiable credentials.

Entity Data: ${JSON.stringify(entityData)}
Framework: ${framework || 'GDPR, eIDAS, W3C VC'}

Provide:
1. Compliance Score (0-100)
2. Framework-Specific Findings
3. Gaps Identified
4. Required Actions
5. Timeline for Remediation
6. Priority Level for Each Finding
7. Best Practices Recommendations`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI DID Resolver & Analyzer
router.post('/analyze-did', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { didDocument } = req.body;
    const prompt = `Analyze this DID (Decentralized Identifier) document. Assess its structure, security, and compliance with W3C DID Core specification.

DID Document: ${JSON.stringify(didDocument)}

Provide:
1. DID Method Assessment
2. Verification Methods Analysis
3. Service Endpoints Review
4. Security Posture Score (0-100)
5. W3C DID Core Compliance
6. Interoperability Assessment
7. Key Management Recommendations
8. Potential Vulnerabilities`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Trust Score Calculator
router.post('/calculate-trust', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { entityData, identity_id } = req.body;
    const prompt = `Calculate a comprehensive trust score for this entity in the digital identity ecosystem. Consider multiple trust dimensions.

Entity Data: ${JSON.stringify(entityData)}

Provide:
1. Overall Trust Score (0-100)
2. Trust Dimensions Breakdown:
   - Identity Assurance Level
   - Credential Quality Score
   - Behavioral Trust Score
   - Network Trust Score
   - Historical Trust Score
3. Trust Factors (positive and negative)
4. Comparison to Ecosystem Average
5. Trust Improvement Recommendations
6. Trust Level Classification (Untrusted/Low/Medium/High/Very High)`;

    const result = await callOpenRouter(prompt);

    // Parse trust score and write back if identity_id provided
    let trustScore = null;
    if (identity_id && result.content) {
      const scoreMatch = result.content.match(/Overall Trust Score[:\s]+\**(\d+)\**/i)
        || result.content.match(/Trust Score[:\s]+\**(\d+)\**/i)
        || result.content.match(/\b(\d{1,3})\s*\/\s*100\b/);
      if (scoreMatch) {
        trustScore = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
        try {
          await pool.query(
            'UPDATE digital_identities SET ai_trust_score = $1 WHERE id = $2',
            [trustScore, identity_id]
          );

          // If trust score < 30, auto-create risk_assessment and fraud_alert records
          if (trustScore < 30) {
            await pool.query(`
              INSERT INTO risk_assessments (entity_type, entity_id, risk_level, risk_score, risk_factors, recommendations)
              VALUES ('digital_identity', $1, 'high', $2, $3, $4)
            `, [
              identity_id,
              100 - trustScore,
              JSON.stringify([`AI trust score critically low: ${trustScore}/100`]),
              JSON.stringify(['Immediate identity review required', 'Suspend active credentials pending investigation'])
            ]);

            await pool.query(`
              INSERT INTO fraud_alerts (entity_type, entity_id, alert_type, severity, description, indicators, status)
              VALUES ('digital_identity', $1, 'low_trust_score', 'high', $2, $3, 'open')
            `, [
              identity_id,
              `Automated alert: AI trust score below threshold (${trustScore}/100). Potential fraud or identity integrity issue.`,
              JSON.stringify([`Trust score: ${trustScore}/100`, 'Score below 30 threshold', 'Automated detection'])
            ]);
          }
        } catch (writeErr) {
          console.error('Trust score write-back error:', writeErr.message);
        }
      }
    }

    res.json({ analysis: result, trust_score_applied: trustScore, identity_id: identity_id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Credential Generator
router.post('/generate-credential', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { credentialType, subjectData } = req.body;
    const prompt = `Generate a W3C-compliant Verifiable Credential template for the following:

Credential Type: ${credentialType || 'General Purpose'}
Subject Data: ${JSON.stringify(subjectData)}

Generate:
1. Complete VC JSON-LD Structure
2. Recommended Credential Schema
3. Required Verification Methods
4. Suggested Proof Type
5. Recommended Issuance Policy
6. Privacy Considerations
7. Selective Disclosure Options
8. Expiration Policy Recommendation`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Schema Analyzer
router.post('/analyze-schema', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { schemaData } = req.body;
    const prompt = `Analyze this credential schema for completeness, security, and interoperability in the digital identity ecosystem.

Schema Data: ${JSON.stringify(schemaData)}

Provide:
1. Schema Quality Score (0-100)
2. Completeness Assessment
3. Security Review
4. Interoperability Analysis
5. Data Minimization Compliance
6. Privacy Impact Assessment
7. Suggested Improvements
8. Industry Standard Alignment`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Privacy Advisor
router.post('/privacy-advice', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { sharingContext } = req.body;
    const prompt = `Provide privacy advice for this credential sharing scenario in the digital identity context.

Sharing Context: ${JSON.stringify(sharingContext)}

Provide:
1. Privacy Risk Score (0-100)
2. Data Minimization Recommendations
3. Selective Disclosure Strategy
4. Consent Requirements
5. Data Retention Advice
6. Cross-Border Transfer Considerations
7. Privacy-Enhancing Technology Recommendations
8. GDPR/CCPA Compliance Tips`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Anomaly Detector (for audit logs)
router.post('/detect-anomalies', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const logs = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    const prompt = `Analyze these audit logs from a digital identity platform for anomalies, suspicious patterns, and security concerns.

Audit Logs: ${JSON.stringify(logs.rows)}

Provide:
1. Anomaly Detection Summary
2. Suspicious Patterns Identified
3. Security Incidents
4. User Behavior Analysis
5. System Health Indicators
6. Risk Assessment
7. Recommended Investigations
8. Preventive Measures`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Presentation Matcher
router.post('/match-presentation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { request, availableCredentials } = req.body;
    const prompt = `Match available credentials to this presentation request. Determine which credentials satisfy the verifier's requirements with selective disclosure.

Presentation Request: ${JSON.stringify(request)}
Available Credentials: ${JSON.stringify(availableCredentials)}

Provide:
1. Matching Score (0-100)
2. Matched Credentials
3. Unmet Requirements
4. Selective Disclosure Plan
5. Privacy Optimization
6. Alternative Fulfillment Options
7. Verifier Trust Assessment
8. Recommendations`;

    const result = await callOpenRouter(prompt);
    res.json({ analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard AI Summary
router.post('/dashboard-summary', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const [identities, credentials, fraudAlerts, riskAssessments, compliance] = await Promise.all([
      pool.query('SELECT COUNT(*), COUNT(*) FILTER (WHERE status = \'active\') as active FROM digital_identities'),
      pool.query('SELECT COUNT(*), COUNT(*) FILTER (WHERE status = \'active\') as active FROM verifiable_credentials'),
      pool.query('SELECT COUNT(*), COUNT(*) FILTER (WHERE status = \'open\') as open FROM fraud_alerts'),
      pool.query('SELECT AVG(risk_score) as avg_risk, COUNT(*) FILTER (WHERE risk_level = \'high\' OR risk_level = \'critical\') as high_risk FROM risk_assessments'),
      pool.query('SELECT COUNT(*), COUNT(*) FILTER (WHERE status = \'passed\') as passed, COUNT(*) FILTER (WHERE status = \'failed\') as failed FROM compliance_checks')
    ]);

    const stats = {
      identities: identities.rows[0],
      credentials: credentials.rows[0],
      fraudAlerts: fraudAlerts.rows[0],
      riskAssessments: riskAssessments.rows[0],
      compliance: compliance.rows[0]
    };

    const prompt = `Provide an executive summary and actionable insights for this digital identity platform dashboard.

Platform Statistics: ${JSON.stringify(stats)}

Provide:
1. Executive Summary (2-3 sentences)
2. Key Metrics Interpretation
3. Security Posture Assessment
4. Top 3 Priorities
5. Risk Trend Analysis
6. Compliance Status Overview
7. Recommended Actions`;

    const result = await callOpenRouter(prompt);
    res.json({ stats, analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
