# Operations and safety boundary

The launcher is non-destructive; bootstrap, migrations, and guarded demo seed are separate. Never place private keys or seed phrases in `.env` or application storage.

`/api/credential-lifecycle` records offers, externally signed issuance proofs, status/revocation, consent-bound presentation checks, nonce/audience validation, and audit history. It deliberately stores a wallet/KMS reference rather than a private key. DID methods, trust registries, wallets, proofing, status lists, and relying-party adapters remain blocked until standards conformance, interoperability, recovery, privacy, replay, and threat-model testing is completed.
