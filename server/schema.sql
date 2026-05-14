-- AI Digital Identity & Verifiable Credentials Platform Schema

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS presentation_requests CASCADE;
DROP TABLE IF EXISTS credential_shares CASCADE;
DROP TABLE IF EXISTS fraud_alerts CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS revocation_entries CASCADE;
DROP TABLE IF EXISTS trust_registry CASCADE;
DROP TABLE IF EXISTS credential_schemas CASCADE;
DROP TABLE IF EXISTS credential_templates CASCADE;
DROP TABLE IF EXISTS verifiable_credentials CASCADE;
DROP TABLE IF EXISTS identity_verifications CASCADE;
DROP TABLE IF EXISTS did_documents CASCADE;
DROP TABLE IF EXISTS digital_identities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 1. Digital Identities
CREATE TABLE digital_identities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  identity_name VARCHAR(255) NOT NULL,
  identity_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  public_key TEXT,
  metadata JSONB DEFAULT '{}',
  ai_trust_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. DID Documents
CREATE TABLE did_documents (
  id SERIAL PRIMARY KEY,
  did_uri VARCHAR(500) UNIQUE NOT NULL,
  method VARCHAR(100) NOT NULL,
  controller VARCHAR(500),
  verification_methods JSONB DEFAULT '[]',
  services JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Verifiable Credentials
CREATE TABLE verifiable_credentials (
  id SERIAL PRIMARY KEY,
  credential_type VARCHAR(200) NOT NULL,
  issuer VARCHAR(500) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  issuance_date TIMESTAMP DEFAULT NOW(),
  expiration_date TIMESTAMP,
  credential_data JSONB NOT NULL DEFAULT '{}',
  proof JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  ai_verification_result TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Identity Verifications
CREATE TABLE identity_verifications (
  id SERIAL PRIMARY KEY,
  identity_id INTEGER REFERENCES digital_identities(id) ON DELETE CASCADE,
  verification_type VARCHAR(100) NOT NULL,
  verification_method VARCHAR(100) NOT NULL,
  result VARCHAR(50) NOT NULL,
  confidence_score DECIMAL(5,2),
  details JSONB DEFAULT '{}',
  ai_analysis TEXT,
  verified_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Credential Templates
CREATE TABLE credential_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL,
  schema_definition JSONB NOT NULL DEFAULT '{}',
  visual_design JSONB DEFAULT '{}',
  issuer_requirements JSONB DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  ai_suggestions TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Trust Registry
CREATE TABLE trust_registry (
  id SERIAL PRIMARY KEY,
  entity_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_did VARCHAR(500),
  trust_level VARCHAR(50) NOT NULL,
  governance_framework VARCHAR(255),
  credentials_types JSONB DEFAULT '[]',
  ai_trust_evaluation TEXT,
  status VARCHAR(50) DEFAULT 'active',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Credential Schemas
CREATE TABLE credential_schemas (
  id SERIAL PRIMARY KEY,
  schema_name VARCHAR(255) NOT NULL,
  schema_version VARCHAR(50) NOT NULL,
  schema_type VARCHAR(100) NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  required_fields JSONB DEFAULT '[]',
  ai_validation_rules TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Revocation Entries
CREATE TABLE revocation_entries (
  id SERIAL PRIMARY KEY,
  credential_id INTEGER REFERENCES verifiable_credentials(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  revoked_by VARCHAR(255) NOT NULL,
  revocation_list_url VARCHAR(500),
  ai_revocation_analysis TEXT,
  revoked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Risk Assessments
CREATE TABLE risk_assessments (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  risk_level VARCHAR(50) NOT NULL,
  risk_score DECIMAL(5,2) NOT NULL,
  risk_factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  ai_analysis TEXT,
  assessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Compliance Checks
CREATE TABLE compliance_checks (
  id SERIAL PRIMARY KEY,
  check_name VARCHAR(255) NOT NULL,
  framework VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  findings JSONB DEFAULT '[]',
  ai_compliance_report TEXT,
  checked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Fraud Alerts
CREATE TABLE fraud_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  indicators JSONB DEFAULT '[]',
  ai_fraud_analysis TEXT,
  status VARCHAR(50) DEFAULT 'open',
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Credential Shares
CREATE TABLE credential_shares (
  id SERIAL PRIMARY KEY,
  credential_id INTEGER REFERENCES verifiable_credentials(id) ON DELETE CASCADE,
  shared_with VARCHAR(500) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  disclosed_fields JSONB DEFAULT '[]',
  access_policy JSONB DEFAULT '{}',
  ai_privacy_analysis TEXT,
  status VARCHAR(50) DEFAULT 'active',
  expires_at TIMESTAMP,
  shared_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Presentation Requests
CREATE TABLE presentation_requests (
  id SERIAL PRIMARY KEY,
  verifier VARCHAR(500) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  requested_credentials JSONB NOT NULL DEFAULT '[]',
  constraints JSONB DEFAULT '{}',
  ai_matching_result TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 14. Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  actor VARCHAR(255) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  ai_anomaly_flag BOOLEAN DEFAULT false,
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. AI Results (durable AI output store with JSONB)
DROP TABLE IF EXISTS ai_results CASCADE;
CREATE TABLE ai_results (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  analysis_type VARCHAR(100) NOT NULL,
  content TEXT,
  result_json JSONB DEFAULT '{}'::jsonb,
  ai_model VARCHAR(200),
  prompt_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_entity ON ai_results(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);
