# Audit Apply Notes — AIDigitalIdentityVerifiableCredentials

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 1364-1391).

The audit reports 0 AI endpoints. Inspection shows 16+ AI endpoints between
`server/routes/ai-center.js` (verify-identity, validate-credential,
assess-risk, detect-fraud, check-compliance, analyze-did, calculate-trust,
generate-credential, analyze-schema, privacy-advice, detect-anomalies,
match-presentation, dashboard-summary) and `server/routes/aiNew.js`
(compliance-report, credential-batch-validate, identity-risk-report). Audit
metadata is stale.

Per apply-pass policy (>15 AI endpoints → backlog-only), this pass is
**backlog-only**.

## Original audit recommendations

### Missing AI counterparts (audit, mostly already covered)
- `/verify-credential` — covered by `/validate-credential`.
- `/validate-identity` — covered by `/verify-identity`.
- `/issue-credential` — partly via `/generate-credential`.
- `/revoke-credential` — not covered.
- `/analyze-credential-chain` — partly via `/analyze-did`.

### Missing non-AI features
- Credential issuer/verifier workflows.
- Blockchain integration (Ethereum, Hyperledger, did:key).
- DID resolution.
- Presentation/proof generation.

### Custom feature suggestions
- Credential trust scoring.
- Privacy-preserving verification (ZKPs).
- Cross-chain credential bridging.
- Revocation monitoring.

## Implemented in this pass

None. Backlog-only.

## Backlog (prioritized)

### Mechanical, low-risk
1. `/api/ai/revocation-impact` — given a credential, predict downstream
   impact of revocation.
2. `/api/ai/credential-chain-analyzer` — explicit endpoint complementing
   `/analyze-did`.

### Needs product decision
- Issuer/verifier workflow data model.
- ZKP / selective-disclosure scope.

### Needs credentials / external SDK
- Blockchain RPC libraries (ethers, hyperledger SDK, did:key).
- Status-list providers for revocation.

### Too risky / large refactor
- On-chain credential operations (transaction signing, key custody).
- Cross-chain bridging.

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS (FE already wired).

`client/src/pages/AICenter.jsx` is a comprehensive form-driven UI covering all 13+ `/api/ai-center/*` endpoints (`verify-identity`, `validate-credential`, `assess-risk`, `detect-fraud`, `check-compliance`, `analyze-did`, `calculate-trust`, `generate-credential`, `analyze-schema`, `privacy-advice`, `detect-anomalies`, `match-presentation`, `dashboard-summary`) plus the `aiNew.js` endpoints. Each feature has its own `fields` array; results render via `components/AIResultDisplay`. Auth via `apiPost` in `client/src/api.js` (Bearer token from localStorage). Sidebar in `App.jsx` includes "AI Center" entry.

Backend mount verified: `app.use('/api/ai-center', aiCenterRoutes)` and `app.use('/api/ai', aiNewRoutes)` in `server/index.js`.

Files: none modified.

## Apply pass 4 (mechanical backlog)

Implemented the two mechanical items from the prior backlog list.

### Backend (`server/routes/aiNew.js`, extended)

1. **POST `/api/ai/revocation-impact`** — input `{ credential_id }`. Pulls the credential, related `credential_shares`, `presentation_requests`, `revocation_entries`, and `trust_registry` rows (each guarded by try/catch for schema variance) and asks the LLM for a structured downstream-impact narrative.
2. **POST `/api/ai/credential-chain-analyzer`** — input `{ did_uri }` or `{ issuer }`. Pulls the matching `did_documents` row, all `verifiable_credentials` issued by the anchor, `revocation_entries` among them, and `trust_registry` entries. Asks the LLM for a chain-trustworthiness assessment.

Both endpoints:
- Return **HTTP 503** when `OPENROUTER_API_KEY` is unset.
- Use existing `authenticateToken` + `aiRateLimiter` middleware.
- Use the existing `callOpenRouter` helper.
- Match the response shape of the other `aiNew.js` endpoints (`{ ..., report, generated_at, ai_response }`), so the existing `client/src/pages/AICenter.jsx` extractor handles them automatically.

### Frontend (`client/src/pages/AICenter.jsx`, extended)
Appended two new entries to the `aiFeatures` array:
- "AI Revocation Impact" — tomato icon, single `credential_id` numeric field, `flatPayload: true`.
- "AI Credential Chain Analyzer" — link icon, optional `did_uri` and `issuer` fields, `flatPayload: true`.

No new dependencies, no styling changes; reuses the existing tile/back/form layout, `apiPost` Bearer-token helper, and `AIResultDisplay` component.

### Smoke test
Started server on port 3092 (3001 occupied by external auto-restart process). Logged in as `admin@identity.io / password123`, called `POST /api/ai/revocation-impact` with `credential_id=1` — got **HTTP 200** and a complete LLM-generated impact report (Claude 4.5 Haiku via OpenRouter). Cleaned up.

Route registration verified by enumerating `router.stack` paths in `aiNew.js`: includes `compliance-report`, `credential-batch-validate`, `identity-risk-report`, `revocation-impact`, `credential-chain-analyzer`.

### Files modified
- `server/routes/aiNew.js`
- `client/src/pages/AICenter.jsx`

## Apply pass 5 (all backlog)

Implemented 5 endpoints additively (cap was 10) by appending to `server/routes/aiNew.js`. No changes to working code, no new deps.

### Backend (new endpoints — all gate on OPENROUTER_API_KEY at minimum)
1. `POST /api/ai/issuer-workflow` — NEEDS-PRODUCT-DECISION resolved. PRODUCT-DECISION: simple state machine (draft, review, approved, rejected, revoked) backed by new `vc_workflows` table (CREATE TABLE IF NOT EXISTS). Body `{ credential_id, action: 'create'|'transition', target_state? }`.
2. `POST /api/ai/verifier-workflow` — NEEDS-PRODUCT-DECISION resolved. Records a verifier outcome (pass/fail) in the same `vc_workflows` table; LLM produces follow-up advice.
3. `POST /api/ai/selective-disclosure` — NEEDS-PRODUCT-DECISION resolved. PRODUCT-DECISION: simulated only (no real BBS+/Groth16 toolkit). Returns a JSON disclosure plan listing which fields to disclose / hide / cover with predicate proofs.
4. `POST /api/ai/blockchain-anchor` — NEEDS-CREDS. Returns 503 + `missing: 'BLOCKCHAIN_RPC_URL'` when unset. Additive only: never makes a real on-chain call. Documents env vars `BLOCKCHAIN_RPC_URL` + `BLOCKCHAIN_PRIVATE_KEY`.
5. `POST /api/ai/status-list-check` — NEEDS-CREDS. Returns 503 + `missing: 'STATUS_LIST_PROVIDER_URL'` when unset. Additive only: simulated W3C StatusList2021 check.

Schema additions: `vc_workflows` only — `CREATE TABLE IF NOT EXISTS`, ensured lazily on first call (cached after first run).

### Frontend
Appended 5 tiles to `aiFeatures` array in `client/src/pages/AICenter.jsx` (Issuer Workflow, Verifier Workflow, Selective Disclosure, Blockchain Anchor, Status-List Check). Reuses existing `apiPost` Bearer-token helper, existing tile/back/form layout, existing `AIResultDisplay`. No new dependencies.

### Smoke test
Started server on port 3082. Login as `admin@identity.io / password123` succeeded. Called `POST /api/ai/issuer-workflow` with `{credential_id:'1',action:'create'}` — got HTTP 200 with new workflow row + LLM-generated next-action recommendation (Claude Haiku 4.5 via OpenRouter). Called `/api/ai/blockchain-anchor` — got HTTP 503 + `{"error":"...","missing":"BLOCKCHAIN_RPC_URL"}` as designed.

### Files modified
- `server/routes/aiNew.js` (extended)
- `client/src/pages/AICenter.jsx` (extended)
