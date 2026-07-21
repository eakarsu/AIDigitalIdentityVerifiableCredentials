const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIssue, assertTransition, validatePresentation } = require('../domain/credentialWorkflow');

test('issuance refuses key custody and requires consent', () => {
  const req = { subjectDid: 'did:key:z6Mk', schemaUri: 'https://example/schema', issuerKeyReference: 'kms://issuer/1', consentReceiptId: 'c1', expiresAt: '2999-01-01' };
  assert.equal(validateIssue(req), true);
  assert.throws(() => validateIssue({ ...req, privateKey: 'secret' }), /custody/);
});

test('presentation prevents replay/audience-less disclosure', () => {
  assert.throws(() => validatePresentation({ challenge: 'old' }, 'new'), /mismatch/);
  assert.equal(validatePresentation({ challenge: 'new', audience: 'rp', consentReceiptId: 'c1' }, 'new'), true);
  assert.throws(() => assertTransition('offered', 'issued', {}), /signature proof/);
});
