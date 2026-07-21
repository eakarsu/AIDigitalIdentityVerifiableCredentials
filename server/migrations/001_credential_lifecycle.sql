ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE TABLE IF NOT EXISTS credential_lifecycles(
 id BIGSERIAL PRIMARY KEY,tenant_id TEXT NOT NULL,subject_did TEXT NOT NULL,schema_uri TEXT NOT NULL,issuer_key_reference TEXT NOT NULL,
 consent_receipt_id TEXT NOT NULL,expires_at TIMESTAMPTZ NOT NULL,idempotency_key TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'draft',created_by BIGINT NOT NULL,
 external_signature_proof TEXT,status_list_index TEXT,revocation_reason TEXT,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW(),UNIQUE(tenant_id,idempotency_key),
 CHECK(state IN('draft','offered','issued','suspended','revoked','expired','cancelled'))
);
CREATE TABLE IF NOT EXISTS credential_lifecycle_events(id BIGSERIAL PRIMARY KEY,credential_id BIGINT NOT NULL REFERENCES credential_lifecycles(id) ON DELETE RESTRICT,actor_id BIGINT NOT NULL,from_state TEXT,to_state TEXT NOT NULL,details JSONB NOT NULL DEFAULT '{}',created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS presentation_checks(id BIGSERIAL PRIMARY KEY,credential_id BIGINT NOT NULL REFERENCES credential_lifecycles(id) ON DELETE RESTRICT,verifier_id BIGINT NOT NULL,challenge TEXT NOT NULL,audience TEXT NOT NULL,consent_receipt_id TEXT NOT NULL,valid BOOLEAN NOT NULL,details JSONB NOT NULL DEFAULT '{}',created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS credential_lifecycles_tenant_state_idx ON credential_lifecycles(tenant_id,state);
