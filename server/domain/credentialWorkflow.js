const TRANSITIONS = Object.freeze({
  draft: ['offered', 'cancelled'], offered: ['issued', 'expired', 'cancelled'],
  issued: ['suspended', 'revoked', 'expired'], suspended: ['issued', 'revoked'],
  revoked: [], expired: [], cancelled: []
});

function validateIssue(request) {
  if (!request || !request.subjectDid || !request.schemaUri || !request.issuerKeyReference) throw new Error('subjectDid, schemaUri, and issuerKeyReference are required');
  if (!request.consentReceiptId) throw new Error('subject consent receipt is required');
  if (request.privateKey || request.seedPhrase) throw new Error('server-side private key custody is prohibited');
  if (!request.expiresAt || Date.parse(request.expiresAt) <= Date.now()) throw new Error('future expiry is required');
  return true;
}

function assertTransition(from, to, context = {}) {
  if (!(TRANSITIONS[from] || []).includes(to)) throw new Error(`transition ${from} -> ${to} is not allowed`);
  if (to === 'issued' && (!context.externalSignatureProof || !context.statusListIndex)) throw new Error('wallet/KMS signature proof and status-list index required');
  if (to === 'revoked' && !context.reason) throw new Error('revocation reason required');
  return true;
}

function validatePresentation(presentation, nonce) {
  if (!presentation || presentation.challenge !== nonce) throw new Error('presentation challenge mismatch');
  if (!presentation.audience || !presentation.consentReceiptId) throw new Error('audience and consent receipt required');
  return true;
}

module.exports = { TRANSITIONS, validateIssue, assertTransition, validatePresentation };
