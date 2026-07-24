const pool = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12) throw new Error('DEMO_PASSWORD must be at least 12 characters');
  return password;
}

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Seed users
    const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
    await client.query(`
      INSERT INTO users (email, password, full_name, role) VALUES
      ('admin@identity.io', $1, 'Alex Administrator', 'admin'),
      ('issuer@identity.io', $1, 'Isabella Issuer', 'issuer'),
      ('verifier@identity.io', $1, 'Victor Verifier', 'verifier'),
      ('user@identity.io', $1, 'Uma User', 'user')
    `, [hashedPassword]);
    console.log('Users seeded');

    // 1. Digital Identities (15 items)
    await client.query(`
      INSERT INTO digital_identities (user_id, identity_name, identity_type, status, public_key, metadata, ai_trust_score) VALUES
      (1, 'Alex Primary Identity', 'Personal', 'active', 'ed25519:abc123def456', '{"country": "US", "age_verified": true}', 95.5),
      (2, 'Isabella Corp Identity', 'Organization', 'active', 'ed25519:ghi789jkl012', '{"org": "TrustCorp", "department": "Issuance"}', 98.2),
      (3, 'Victor Gov Identity', 'Government', 'active', 'ed25519:mno345pqr678', '{"agency": "DigitalGov", "clearance": "high"}', 99.1),
      (4, 'Uma Student Identity', 'Educational', 'active', 'ed25519:stu901vwx234', '{"university": "MIT", "program": "CS"}', 88.7),
      (1, 'Alex Business ID', 'Business', 'active', 'ed25519:yz567abc890', '{"company": "TechStartup Inc", "role": "CEO"}', 92.3),
      (2, 'Isabella Healthcare ID', 'Healthcare', 'active', 'ed25519:def123ghi456', '{"provider": "MedTrust", "license": "MD-2024"}', 96.8),
      (3, 'Victor Financial ID', 'Financial', 'active', 'ed25519:jkl789mno012', '{"institution": "SecureBank", "tier": "premium"}', 97.5),
      (4, 'Uma Travel Identity', 'Travel', 'pending', 'ed25519:pqr345stu678', '{"passport_country": "US", "visa_status": "valid"}', 85.0),
      (1, 'Alex IoT Device ID', 'Device', 'active', 'ed25519:vwx901yza234', '{"device_type": "smart_lock", "manufacturer": "SecureHome"}', 78.5),
      (2, 'Isabella Legal ID', 'Legal', 'active', 'ed25519:bcd567efg890', '{"bar_association": "ABA", "license_no": "LA-55892"}', 99.0),
      (3, 'Victor Military ID', 'Military', 'active', 'ed25519:hij123klm456', '{"branch": "Air Force", "rank": "Colonel"}', 99.8),
      (4, 'Uma Freelancer ID', 'Professional', 'active', 'ed25519:nop789qrs012', '{"platform": "VerifiedWork", "rating": 4.9}', 87.3),
      (1, 'Alex Social Identity', 'Social', 'active', 'ed25519:tuv345wxy678', '{"platforms_linked": 5, "reputation_score": 920}', 82.1),
      (2, 'Isabella Research ID', 'Academic', 'active', 'ed25519:zab901cde234', '{"institution": "Stanford", "orcid": "0000-0001-2345-6789"}', 94.6),
      (3, 'Victor Emergency ID', 'Emergency', 'active', 'ed25519:fgh567ijk890', '{"blood_type": "O+", "allergies": "none", "emer_contact": true}', 91.2)
    `);
    console.log('Digital identities seeded');

    // 2. DID Documents (15 items)
    await client.query(`
      INSERT INTO did_documents (did_uri, method, controller, verification_methods, services, status) VALUES
      ('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK', 'key', 'did:key:z6MkhaXg...', '[{"id": "#key-1", "type": "Ed25519VerificationKey2020", "purpose": "authentication"}]', '[{"type": "LinkedDomains", "endpoint": "https://identity.example.com"}]', 'active'),
      ('did:web:identity.example.com', 'web', 'did:web:identity.example.com', '[{"id": "#key-1", "type": "JsonWebKey2020", "purpose": "assertionMethod"}]', '[{"type": "CredentialRegistry", "endpoint": "https://registry.example.com"}]', 'active'),
      ('did:ion:EiAnKD8-jfdd0MDcZUjAbRgaThBrMxPTFOxcnfJhI7Ukaw', 'ion', 'did:ion:EiAnKD8...', '[{"id": "#key-1", "type": "EcdsaSecp256k1VerificationKey2019"}]', '[{"type": "IdentityHub", "endpoint": "https://hub.example.com"}]', 'active'),
      ('did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a', 'ethr', 'did:ethr:0xb9c571...', '[{"id": "#delegate-1", "type": "EcdsaSecp256k1RecoveryMethod2020"}]', '[{"type": "DIDComm", "endpoint": "https://comm.example.com"}]', 'active'),
      ('did:sov:WRfXPg8dantKVubE3HX8pw', 'sov', 'did:sov:WRfXPg8...', '[{"id": "#key-1", "type": "Ed25519VerificationKey2018"}]', '[{"type": "AgentService", "endpoint": "https://agent.example.com"}]', 'active'),
      ('did:peer:2.Ez6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc', 'peer', 'did:peer:2.Ez6LSb...', '[{"id": "#key-1", "type": "X25519KeyAgreementKey2020"}]', '[{"type": "Messaging", "endpoint": "https://msg.example.com"}]', 'active'),
      ('did:pkh:eip155:1:0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', 'pkh', 'did:pkh:eip155...', '[{"id": "#blockchainAccountId", "type": "EcdsaSecp256k1VerificationKey2019"}]', '[]', 'active'),
      ('did:tz:tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8', 'tz', 'did:tz:tz1Tzrm...', '[{"id": "#key-1", "type": "Ed25519VerificationKey2018"}]', '[{"type": "TezosNode", "endpoint": "https://tezos.example.com"}]', 'active'),
      ('did:ebsi:znHeZWvhAK2FK2dqwd5KQ5z', 'ebsi', 'did:ebsi:znHeZW...', '[{"id": "#key-1", "type": "JsonWebKey2020", "purpose": "authentication"}]', '[{"type": "TrustedIssuer", "endpoint": "https://ebsi.example.eu"}]', 'active'),
      ('did:cheqd:mainnet:7c2b990c-3d05-4ebf-91af-517ab4a3ed72', 'cheqd', 'did:cheqd:mainnet...', '[{"id": "#key-1", "type": "Ed25519VerificationKey2020"}]', '[{"type": "DIDLinkedResource", "endpoint": "https://cheqd.example.com"}]', 'active'),
      ('did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwidCI6Imp3ayJ9', 'jwk', 'did:jwk:eyJjcnYi...', '[{"id": "#0", "type": "JsonWebKey2020"}]', '[]', 'active'),
      ('did:polygonid:polygon:main:2q544HUegzeq9Cig1bZwSNbkMGEFMgWXmC4CG29VeN', 'polygonid', 'did:polygonid:polygon...', '[{"id": "#key-1", "type": "EcdsaSecp256k1VerificationKey2019"}]', '[{"type": "ZKProof", "endpoint": "https://polygon.example.com"}]', 'active'),
      ('did:iota:0xe4edef97da1257e83cbeb49159cfdd2da6ac971ac447f233f8bc29042ceafef5', 'iota', 'did:iota:0xe4edef...', '[{"id": "#key-1", "type": "Ed25519VerificationKey2018"}]', '[{"type": "Tangle", "endpoint": "https://iota.example.com"}]', 'active'),
      ('did:ens:vitalik.eth', 'ens', 'did:ens:vitalik.eth', '[{"id": "#key-1", "type": "EcdsaSecp256k1VerificationKey2019"}]', '[{"type": "ENSProfile", "endpoint": "https://ens.example.com"}]', 'active'),
      ('did:gatc:5nRz4kBPH4xBFJ9jVWt3mRNGBHctYMhximKrbo27hQkn', 'gatc', 'did:gatc:5nRz4k...', '[{"id": "#key-1", "type": "Ed25519VerificationKey2020"}]', '[{"type": "GovernanceFramework", "endpoint": "https://gatc.example.com"}]', 'active')
    `);
    console.log('DID documents seeded');

    // 3. Verifiable Credentials (15 items)
    await client.query(`
      INSERT INTO verifiable_credentials (credential_type, issuer, subject, expiration_date, credential_data, proof, status) VALUES
      ('UniversityDegree', 'did:web:mit.edu', 'did:key:z6MkhaXg...', '2030-01-01', '{"degree": "BSc Computer Science", "gpa": 3.85, "honors": "Magna Cum Laude"}', '{"type": "Ed25519Signature2020", "created": "2024-06-15"}', 'active'),
      ('EmploymentCredential', 'did:web:google.com', 'did:key:z6MkhaXg...', '2025-12-31', '{"position": "Senior Engineer", "department": "Cloud", "start_date": "2022-03-01"}', '{"type": "Ed25519Signature2020", "created": "2024-01-10"}', 'active'),
      ('GovernmentID', 'did:web:gov.us', 'did:ethr:0xb9c571...', '2029-06-30', '{"id_number": "***-**-1234", "nationality": "US", "date_of_birth": "1990-05-15"}', '{"type": "BbsBlsSignature2020", "created": "2024-03-20"}', 'active'),
      ('HealthInsurance', 'did:web:healthcorp.com', 'did:key:z6MkhaXg...', '2025-12-31', '{"plan": "Premium Gold", "member_id": "HC-2024-789", "coverage": "comprehensive"}', '{"type": "Ed25519Signature2020", "created": "2024-01-01"}', 'active'),
      ('ProfessionalLicense', 'did:web:bar-assoc.org', 'did:sov:WRfXPg8...', '2026-08-15', '{"license_type": "Attorney", "jurisdiction": "California", "bar_number": "CA-334521"}', '{"type": "Ed25519Signature2020", "created": "2024-02-28"}', 'active'),
      ('DriverLicense', 'did:web:dmv.ca.gov', 'did:key:z6MkhaXg...', '2028-05-15', '{"license_class": "C", "state": "California", "restrictions": "none"}', '{"type": "Ed25519Signature2020", "created": "2024-05-15"}', 'active'),
      ('VaccinationRecord', 'did:web:cdc.gov', 'did:key:z6MkhaXg...', NULL, '{"vaccine": "COVID-19", "doses": 3, "manufacturer": "Moderna", "last_dose": "2024-01-15"}', '{"type": "BbsBlsSignature2020", "created": "2024-01-15"}', 'active'),
      ('AcademicTranscript', 'did:web:stanford.edu', 'did:peer:2.Ez6LSb...', '2030-06-01', '{"institution": "Stanford University", "program": "PhD Data Science", "status": "in_progress"}', '{"type": "Ed25519Signature2020", "created": "2024-09-01"}', 'active'),
      ('FinancialCredential', 'did:web:securebank.com', 'did:ethr:0xb9c571...', '2025-06-30', '{"credit_score_range": "excellent", "account_standing": "good", "verified_income": true}', '{"type": "Ed25519Signature2020", "created": "2024-04-10"}', 'active'),
      ('SecurityClearance', 'did:web:defense.gov', 'did:key:z6MkhaXg...', '2027-03-01', '{"level": "Secret", "investigation_type": "SSBI", "granted_date": "2024-03-01"}', '{"type": "BbsBlsSignature2020", "created": "2024-03-01"}', 'active'),
      ('MedicalLicense', 'did:web:medical-board.org', 'did:key:z6MkhaXg...', '2026-12-31', '{"license_type": "MD", "specialty": "Internal Medicine", "board_certified": true}', '{"type": "Ed25519Signature2020", "created": "2024-07-01"}', 'active'),
      ('TrainingCertificate', 'did:web:aws.amazon.com', 'did:key:z6MkhaXg...', '2027-01-15', '{"certification": "AWS Solutions Architect Professional", "score": 892, "max_score": 1000}', '{"type": "Ed25519Signature2020", "created": "2024-01-15"}', 'active'),
      ('ResidencyProof', 'did:web:city.gov', 'did:key:z6MkhaXg...', '2025-12-31', '{"city": "San Francisco", "state": "California", "verified_since": "2020-06-01"}', '{"type": "Ed25519Signature2020", "created": "2024-06-01"}', 'active'),
      ('InsuranceCredential', 'did:web:insurecorp.com', 'did:key:z6MkhaXg...', '2025-07-01', '{"policy_type": "Life Insurance", "coverage_amount": "$500,000", "premium_status": "current"}', '{"type": "Ed25519Signature2020", "created": "2024-07-01"}', 'active'),
      ('MembershipCredential', 'did:web:ieee.org', 'did:key:z6MkhaXg...', '2025-12-31', '{"organization": "IEEE", "membership_type": "Senior Member", "member_since": "2018"}', '{"type": "Ed25519Signature2020", "created": "2024-01-01"}', 'active')
    `);
    console.log('Verifiable credentials seeded');

    // 4. Identity Verifications (15 items)
    await client.query(`
      INSERT INTO identity_verifications (identity_id, verification_type, verification_method, result, confidence_score, details) VALUES
      (1, 'Document', 'AI Document Analysis', 'passed', 97.5, '{"document_type": "passport", "ai_model": "vision-v3", "checks": ["face_match", "hologram", "mrz"]}'),
      (2, 'Biometric', 'Facial Recognition', 'passed', 99.1, '{"method": "3D_facial_scan", "liveness": true, "match_threshold": 0.95}'),
      (3, 'Knowledge-Based', 'AI Question Generation', 'passed', 88.3, '{"questions_asked": 5, "correct_answers": 4, "difficulty": "high"}'),
      (4, 'Email', 'Domain Verification', 'passed', 100.0, '{"domain": "mit.edu", "verified": true, "method": "DKIM+SPF"}'),
      (5, 'Phone', 'SMS OTP + AI Voice', 'passed', 95.0, '{"carrier_verified": true, "voice_match": 0.92, "otp_verified": true}'),
      (6, 'Address', 'AI Geolocation Analysis', 'passed', 91.2, '{"method": "utility_bill_analysis", "address_match": true, "ai_confidence": 0.91}'),
      (7, 'Financial', 'Bank Statement AI Analysis', 'passed', 94.7, '{"bank_verified": true, "income_verified": true, "fraud_indicators": 0}'),
      (8, 'Social', 'Cross-Platform AI Analysis', 'pending', 72.5, '{"platforms_checked": 3, "consistency_score": 0.72, "status": "needs_review"}'),
      (9, 'Device', 'Hardware Attestation', 'passed', 98.8, '{"tpm_verified": true, "secure_boot": true, "integrity_score": 0.99}'),
      (10, 'Professional', 'License Registry Check', 'passed', 100.0, '{"registry": "bar_association", "license_valid": true, "standing": "good"}'),
      (11, 'Government', 'e-ID Verification', 'passed', 99.9, '{"method": "PIV_card", "cac_verified": true, "clearance_valid": true}'),
      (12, 'Employment', 'AI Resume Analysis', 'passed', 86.5, '{"employer_confirmed": true, "role_match": 0.87, "tenure_verified": true}'),
      (1, 'Liveness', 'Anti-Spoofing AI', 'passed', 99.5, '{"depth_check": true, "texture_analysis": true, "motion_verified": true}'),
      (3, 'Credential', 'Cryptographic Proof Verification', 'passed', 100.0, '{"signature_valid": true, "not_revoked": true, "schema_valid": true}'),
      (5, 'Behavioral', 'AI Behavioral Biometrics', 'passed', 83.9, '{"typing_pattern": 0.85, "mouse_dynamics": 0.82, "session_consistency": 0.84}')
    `);
    console.log('Identity verifications seeded');

    // 5. Credential Templates (15 items)
    await client.query(`
      INSERT INTO credential_templates (template_name, template_type, schema_definition, visual_design, issuer_requirements, ai_generated, status) VALUES
      ('University Degree', 'Education', '{"fields": ["degree", "major", "gpa", "graduation_date", "honors"]}', '{"theme": "academic_blue", "logo_position": "top-left"}', '{"accreditation": "required", "authority": "education_board"}', false, 'active'),
      ('Employment Certificate', 'Employment', '{"fields": ["position", "company", "start_date", "end_date", "department"]}', '{"theme": "corporate_gray", "logo_position": "center"}', '{"hr_approval": true, "company_registration": "required"}', false, 'active'),
      ('Government ID Card', 'Government', '{"fields": ["full_name", "date_of_birth", "id_number", "nationality", "photo"]}', '{"theme": "gov_secure", "security_features": ["hologram", "watermark"]}', '{"government_authority": true, "biometric_enrollment": true}', false, 'active'),
      ('Health Certificate', 'Healthcare', '{"fields": ["patient_name", "condition", "treatment", "physician", "date"]}', '{"theme": "medical_white", "hipaa_compliant": true}', '{"medical_license": "required", "facility_accreditation": true}', false, 'active'),
      ('AI-Generated Professional Badge', 'Professional', '{"fields": ["name", "title", "skills", "endorsements", "ai_skill_score"]}', '{"theme": "modern_gradient", "ai_badge": true}', '{"platform_verification": true}', true, 'active'),
      ('Financial Credential', 'Financial', '{"fields": ["account_holder", "institution", "account_type", "standing", "verified_date"]}', '{"theme": "finance_gold", "encrypted_qr": true}', '{"banking_license": "required", "regulatory_compliance": true}', false, 'active'),
      ('Travel Document', 'Travel', '{"fields": ["traveler_name", "passport_number", "nationality", "visa_type", "validity"]}', '{"theme": "travel_blue", "icao_compliant": true}', '{"immigration_authority": true}', false, 'active'),
      ('AI Skill Assessment', 'Certification', '{"fields": ["candidate", "skill", "level", "ai_score", "assessment_date", "validity"]}', '{"theme": "tech_dark", "ai_generated_badge": true}', '{"assessment_platform": true}', true, 'active'),
      ('Insurance Policy', 'Insurance', '{"fields": ["policyholder", "policy_type", "coverage", "premium", "effective_date"]}', '{"theme": "insurance_green", "policy_qr": true}', '{"insurance_license": "required"}', false, 'active'),
      ('Membership Card', 'Membership', '{"fields": ["member_name", "organization", "membership_type", "since", "expiry"]}', '{"theme": "member_purple", "tier_indicator": true}', '{"organization_verified": true}', false, 'active'),
      ('Age Verification', 'Identity', '{"fields": ["verified_name", "over_18", "over_21", "verification_date"]}', '{"theme": "minimal_white", "privacy_first": true}', '{"identity_provider": true}', false, 'active'),
      ('AI Resume Credential', 'Employment', '{"fields": ["candidate", "skills", "experience_years", "ai_match_score", "verified_projects"]}', '{"theme": "resume_modern", "ai_insights": true}', '{"platform_verified": true}', true, 'active'),
      ('Property Ownership', 'Legal', '{"fields": ["owner", "property_address", "title_number", "registered_date", "encumbrances"]}', '{"theme": "legal_navy", "notarized": true}', '{"land_registry": true, "notary_public": true}', false, 'active'),
      ('IoT Device Certificate', 'Technology', '{"fields": ["device_id", "manufacturer", "model", "firmware_version", "attestation"]}', '{"theme": "tech_circuit", "hardware_bound": true}', '{"manufacturer_verified": true, "security_audit": true}', false, 'active'),
      ('AI Trust Score Badge', 'Trust', '{"fields": ["entity_name", "trust_score", "factors", "assessment_date", "ai_model_version"]}', '{"theme": "trust_gradient", "dynamic_score": true}', '{"trust_framework": true}', true, 'active')
    `);
    console.log('Credential templates seeded');

    // 6. Trust Registry (15 items)
    await client.query(`
      INSERT INTO trust_registry (entity_name, entity_type, entity_did, trust_level, governance_framework, credentials_types, status, verified_at) VALUES
      ('US Department of State', 'Government Issuer', 'did:web:state.gov', 'sovereign', 'US Federal PKI', '["PassportCredential", "VisaCredential"]', 'active', NOW()),
      ('MIT University', 'Educational Issuer', 'did:web:mit.edu', 'high', 'CHEA Accreditation', '["DegreeCredential", "TranscriptCredential"]', 'active', NOW()),
      ('Google Inc.', 'Corporate Issuer', 'did:web:google.com', 'high', 'SOC2 Type II', '["EmploymentCredential", "CertificationCredential"]', 'active', NOW()),
      ('SecureBank Financial', 'Financial Issuer', 'did:web:securebank.com', 'high', 'Basel III Compliance', '["FinancialCredential", "CreditCredential"]', 'active', NOW()),
      ('HealthCorp Insurance', 'Healthcare Issuer', 'did:web:healthcorp.com', 'high', 'HIPAA Compliance', '["InsuranceCredential", "HealthCredential"]', 'active', NOW()),
      ('California DMV', 'Government Issuer', 'did:web:dmv.ca.gov', 'sovereign', 'REAL ID Act', '["DriverLicenseCredential"]', 'active', NOW()),
      ('European Commission', 'Supranational Issuer', 'did:ebsi:znHeZW...', 'sovereign', 'eIDAS 2.0', '["EuropeanDigitalIdentity", "QualifiedCredential"]', 'active', NOW()),
      ('Acme Verification Services', 'Verifier', 'did:web:acmeverify.com', 'medium', 'ISO 27001', '["IdentityVerification", "AgeVerification"]', 'active', NOW()),
      ('TrustNet Alliance', 'Trust Framework', 'did:web:trustnet.org', 'high', 'ToIP Governance', '["TrustFrameworkCredential"]', 'active', NOW()),
      ('IEEE Standards', 'Professional Body', 'did:web:ieee.org', 'high', 'IEEE SA Standards', '["MembershipCredential", "CertificationCredential"]', 'active', NOW()),
      ('CDC Health Authority', 'Healthcare Issuer', 'did:web:cdc.gov', 'sovereign', 'Public Health Framework', '["VaccinationCredential", "HealthCertificate"]', 'active', NOW()),
      ('AWS Training', 'Certification Issuer', 'did:web:aws.amazon.com', 'high', 'ISO 17024', '["TrainingCertificate", "CloudCertification"]', 'active', NOW()),
      ('City of San Francisco', 'Municipal Issuer', 'did:web:sf.gov', 'high', 'Municipal Governance', '["ResidencyCredential", "BusinessLicense"]', 'active', NOW()),
      ('International Bar Association', 'Professional Body', 'did:web:ibanet.org', 'high', 'Legal Practice Standards', '["LegalLicenseCredential"]', 'active', NOW()),
      ('Blockchain Identity Foundation', 'Standards Body', 'did:web:identity.foundation', 'high', 'DIF Governance', '["DIDCredential", "PresentationExchange"]', 'active', NOW())
    `);
    console.log('Trust registry seeded');

    // 7. Credential Schemas (15 items)
    await client.query(`
      INSERT INTO credential_schemas (schema_name, schema_version, schema_type, properties, required_fields, status) VALUES
      ('PersonIdentity', '1.0.0', 'Identity', '{"full_name": "string", "date_of_birth": "date", "nationality": "string", "photo": "image"}', '["full_name", "date_of_birth"]', 'active'),
      ('EducationDegree', '2.1.0', 'Education', '{"institution": "string", "degree": "string", "major": "string", "gpa": "number", "graduation_date": "date"}', '["institution", "degree", "graduation_date"]', 'active'),
      ('EmploymentRecord', '1.5.0', 'Employment', '{"employer": "string", "position": "string", "start_date": "date", "end_date": "date", "department": "string"}', '["employer", "position", "start_date"]', 'active'),
      ('HealthRecord', '3.0.0', 'Healthcare', '{"patient_id": "string", "condition": "string", "treatment": "string", "provider": "string", "date": "date"}', '["patient_id", "provider", "date"]', 'active'),
      ('FinancialStanding', '1.2.0', 'Financial', '{"institution": "string", "account_type": "string", "standing": "string", "verified_date": "date"}', '["institution", "standing"]', 'active'),
      ('DriverLicense', '2.0.0', 'Government', '{"license_number": "string", "class": "string", "state": "string", "expiry": "date", "restrictions": "array"}', '["license_number", "class", "state"]', 'active'),
      ('ProfessionalLicense', '1.0.0', 'Professional', '{"license_type": "string", "issuing_body": "string", "license_number": "string", "jurisdiction": "string"}', '["license_type", "license_number"]', 'active'),
      ('VaccinationRecord', '1.3.0', 'Healthcare', '{"vaccine_name": "string", "manufacturer": "string", "doses": "number", "batch_number": "string"}', '["vaccine_name", "doses"]', 'active'),
      ('AddressProof', '1.0.0', 'Identity', '{"street": "string", "city": "string", "state": "string", "postal_code": "string", "country": "string"}', '["city", "country"]', 'active'),
      ('OrganizationCredential', '1.1.0', 'Organization', '{"org_name": "string", "registration_number": "string", "jurisdiction": "string", "type": "string"}', '["org_name", "registration_number"]', 'active'),
      ('AgeVerification', '1.0.0', 'Identity', '{"over_18": "boolean", "over_21": "boolean", "verification_method": "string"}', '["over_18"]', 'active'),
      ('DeviceAttestation', '2.0.0', 'Technology', '{"device_id": "string", "manufacturer": "string", "firmware": "string", "tpm_version": "string"}', '["device_id", "manufacturer"]', 'active'),
      ('TravelDocument', '1.5.0', 'Travel', '{"document_type": "string", "issuing_country": "string", "document_number": "string", "expiry": "date"}', '["document_type", "document_number"]', 'active'),
      ('InsurancePolicy', '1.0.0', 'Insurance', '{"policy_number": "string", "type": "string", "coverage_amount": "string", "premium": "string"}', '["policy_number", "type"]', 'active'),
      ('SkillAssessment', '1.0.0', 'Certification', '{"skill_name": "string", "proficiency_level": "string", "ai_score": "number", "assessment_method": "string"}', '["skill_name", "proficiency_level"]', 'active')
    `);
    console.log('Credential schemas seeded');

    // 8. Revocation Entries (15 items)
    await client.query(`
      INSERT INTO revocation_entries (credential_id, reason, revoked_by, revocation_list_url) VALUES
      (1, 'Credential expired and not renewed', 'did:web:mit.edu', 'https://mit.edu/revocations/2024/list1'),
      (2, 'Employment terminated', 'did:web:google.com', 'https://google.com/revocations/2024/list1'),
      (3, 'Identity fraud suspected', 'did:web:gov.us', 'https://gov.us/revocations/2024/list1'),
      (4, 'Policy cancelled by holder', 'did:web:healthcorp.com', 'https://healthcorp.com/revocations/2024/list1'),
      (5, 'License suspended pending investigation', 'did:web:bar-assoc.org', 'https://bar-assoc.org/revocations/2024/list1'),
      (6, 'DUI conviction - license revoked', 'did:web:dmv.ca.gov', 'https://dmv.ca.gov/revocations/2024/list1'),
      (7, 'Updated vaccination record issued', 'did:web:cdc.gov', 'https://cdc.gov/revocations/2024/list1'),
      (8, 'Student withdrew from program', 'did:web:stanford.edu', 'https://stanford.edu/revocations/2024/list1'),
      (9, 'Account closed by holder', 'did:web:securebank.com', 'https://securebank.com/revocations/2024/list1'),
      (10, 'Clearance downgraded', 'did:web:defense.gov', 'https://defense.gov/revocations/2024/list1'),
      (11, 'Medical license lapsed', 'did:web:medical-board.org', 'https://medical-board.org/revocations/2024/list1'),
      (12, 'Certification version deprecated', 'did:web:aws.amazon.com', 'https://aws.amazon.com/revocations/2024/list1'),
      (13, 'Holder relocated - proof invalid', 'did:web:city.gov', 'https://city.gov/revocations/2024/list1'),
      (14, 'Policy term completed', 'did:web:insurecorp.com', 'https://insurecorp.com/revocations/2024/list1'),
      (15, 'Membership non-renewal', 'did:web:ieee.org', 'https://ieee.org/revocations/2024/list1')
    `);
    console.log('Revocation entries seeded');

    // 9. Risk Assessments (15 items)
    await client.query(`
      INSERT INTO risk_assessments (entity_type, entity_id, risk_level, risk_score, risk_factors, recommendations) VALUES
      ('identity', 1, 'low', 12.5, '["strong_authentication", "verified_documents"]', '["Enable biometric 2FA", "Annual re-verification"]'),
      ('identity', 2, 'low', 8.2, '["corporate_verified", "multi_factor_auth"]', '["Maintain SOC2 compliance", "Quarterly access review"]'),
      ('credential', 3, 'medium', 45.0, '["approaching_expiry", "single_factor_auth"]', '["Renew before expiry", "Add biometric verification"]'),
      ('identity', 4, 'low', 15.8, '["educational_verified", "recent_enrollment"]', '["Verify graduation status annually"]'),
      ('credential', 5, 'high', 72.3, '["suspended_license", "pending_investigation"]', '["Immediate review required", "Freeze credential usage"]'),
      ('identity', 6, 'medium', 38.5, '["multiple_identities", "cross_jurisdiction"]', '["Consolidate identity documents", "Verify each jurisdiction"]'),
      ('credential', 7, 'low', 5.1, '["government_issued", "biometric_verified"]', '["Standard monitoring", "No action required"]'),
      ('identity', 8, 'medium', 42.0, '["incomplete_verification", "pending_documents"]', '["Complete address verification", "Submit utility bill"]'),
      ('credential', 9, 'low', 11.3, '["hardware_attested", "manufacturer_verified"]', '["Update firmware regularly", "Rotate keys annually"]'),
      ('identity', 10, 'low', 7.5, '["bar_verified", "good_standing"]', '["Monitor license status", "Annual CLE compliance check"]'),
      ('credential', 11, 'high', 85.0, '["anomalous_usage_pattern", "geographic_mismatch"]', '["Immediate credential freeze", "Investigate usage patterns"]'),
      ('identity', 12, 'medium', 35.2, '["freelance_inconsistent", "multiple_platforms"]', '["Cross-reference platform identities", "Request additional verification"]'),
      ('credential', 13, 'low', 18.9, '["recently_issued", "standard_verification"]', '["Standard monitoring schedule"]'),
      ('identity', 14, 'low', 9.8, '["academic_institution", "orcid_verified"]', '["Maintain ORCID link", "Verify publication record"]'),
      ('credential', 15, 'medium', 52.1, '["nearing_expiry", "usage_spike"]', '["Review recent usage", "Plan credential renewal"]')
    `);
    console.log('Risk assessments seeded');

    // 10. Compliance Checks (15 items)
    await client.query(`
      INSERT INTO compliance_checks (check_name, framework, entity_type, entity_id, status, findings) VALUES
      ('GDPR Data Processing Assessment', 'GDPR', 'identity', 1, 'passed', '["Data minimization: compliant", "Consent: documented", "Right to erasure: implemented"]'),
      ('eIDAS Qualified Trust Service', 'eIDAS', 'credential', 1, 'passed', '["Qualified signature: valid", "TSP registration: confirmed", "Audit trail: complete"]'),
      ('HIPAA Privacy Rule Check', 'HIPAA', 'credential', 4, 'passed', '["PHI encryption: AES-256", "Access controls: role-based", "Audit logging: enabled"]'),
      ('SOC2 Type II Controls', 'SOC2', 'identity', 2, 'passed', '["Security controls: effective", "Availability: 99.99%", "Confidentiality: maintained"]'),
      ('PCI DSS Compliance', 'PCI-DSS', 'credential', 9, 'failed', '["Encryption: needs upgrade", "Key management: non-compliant", "Network segmentation: partial"]'),
      ('NIST 800-63 Identity Proofing', 'NIST-800-63', 'identity', 3, 'passed', '["IAL2: achieved", "Evidence collection: sufficient", "Validation: automated"]'),
      ('ISO 27001 ISMS', 'ISO-27001', 'identity', 5, 'passed', '["Risk assessment: current", "Controls: implemented", "Continuous improvement: documented"]'),
      ('W3C VC Data Model', 'W3C-VC', 'credential', 2, 'passed', '["JSON-LD context: valid", "Proof format: compliant", "Credential status: implemented"]'),
      ('CCPA Consumer Rights', 'CCPA', 'identity', 6, 'warning', '["Data disclosure: partial", "Opt-out mechanism: needs improvement", "Data deletion: compliant"]'),
      ('KYC/AML Verification', 'KYC-AML', 'identity', 7, 'passed', '["Identity verified: tier 3", "Sanctions screening: clear", "PEP check: negative"]'),
      ('FIDO2 Authentication Standard', 'FIDO2', 'identity', 9, 'passed', '["WebAuthn: implemented", "CTAP2: supported", "Attestation: valid"]'),
      ('DIF Presentation Exchange', 'DIF-PE', 'credential', 8, 'passed', '["Input descriptors: valid", "Submission requirements: met", "Constraints: satisfied"]'),
      ('OpenID Connect Compliance', 'OIDC', 'identity', 10, 'passed', '["ID Token: valid", "UserInfo endpoint: compliant", "Discovery: configured"]'),
      ('TOIP Trust Framework', 'ToIP', 'credential', 15, 'warning', '["Governance: documented", "Trust assurance: partial", "Interoperability: needs testing"]'),
      ('Basel III Financial Controls', 'Basel-III', 'credential', 9, 'passed', '["Capital adequacy: met", "Risk exposure: within limits", "Liquidity: sufficient"]')
    `);
    console.log('Compliance checks seeded');

    // 11. Fraud Alerts (15 items)
    await client.query(`
      INSERT INTO fraud_alerts (alert_type, severity, entity_type, entity_id, description, indicators, status) VALUES
      ('Identity Theft', 'critical', 'identity', 1, 'Multiple login attempts from unusual geographic locations detected', '["geo_anomaly", "rapid_auth_attempts", "new_device"]', 'open'),
      ('Credential Forgery', 'high', 'credential', 3, 'Potential forged government ID detected by AI analysis', '["inconsistent_fonts", "missing_security_features", "metadata_mismatch"]', 'open'),
      ('Phishing Attack', 'high', 'identity', 4, 'Phishing attempt targeting student credentials detected', '["suspicious_email_link", "domain_spoofing", "urgent_language"]', 'investigating'),
      ('Replay Attack', 'medium', 'credential', 7, 'Same credential presentation used multiple times in short window', '["duplicate_nonce", "rapid_presentations", "same_verifier"]', 'open'),
      ('Synthetic Identity', 'critical', 'identity', 8, 'AI detected synthetic identity combining real and fabricated data', '["inconsistent_history", "no_credit_footprint", "ai_generated_photo"]', 'investigating'),
      ('Credential Stuffing', 'high', 'identity', 2, 'Automated credential stuffing attack detected on corporate account', '["high_velocity_attempts", "known_breach_passwords", "bot_patterns"]', 'resolved'),
      ('DID Hijacking', 'critical', 'identity', 3, 'Unauthorized DID document update attempted', '["unauthorized_key_rotation", "unknown_controller", "signature_mismatch"]', 'open'),
      ('Insider Threat', 'medium', 'identity', 10, 'Unusual data access patterns from privileged account', '["after_hours_access", "bulk_data_export", "privilege_escalation"]', 'investigating'),
      ('Man-in-the-Middle', 'high', 'credential', 5, 'MITM attack detected during credential exchange', '["certificate_mismatch", "ssl_downgrade", "packet_manipulation"]', 'open'),
      ('Account Takeover', 'critical', 'identity', 12, 'Account recovery process exploited', '["social_engineering", "email_redirect", "password_reset_abuse"]', 'open'),
      ('Deepfake Detection', 'high', 'identity', 1, 'AI detected potential deepfake in video verification', '["facial_inconsistency", "audio_artifact", "lip_sync_mismatch"]', 'investigating'),
      ('Sybil Attack', 'medium', 'identity', 6, 'Multiple fake identities created from same source', '["shared_device_fingerprint", "similar_metadata", "coordinated_creation"]', 'open'),
      ('Credential Harvesting', 'high', 'credential', 10, 'Bulk credential verification requests from suspicious verifier', '["high_volume_requests", "unregistered_verifier", "data_extraction_pattern"]', 'open'),
      ('Key Compromise', 'critical', 'identity', 5, 'Private key potentially exposed in code repository', '["github_exposure", "key_material_in_commit", "automated_detection"]', 'resolved'),
      ('Presentation Manipulation', 'medium', 'credential', 12, 'Tampered selective disclosure in verifiable presentation', '["proof_verification_failed", "modified_claims", "invalid_derived_proof"]', 'open')
    `);
    console.log('Fraud alerts seeded');

    // 12. Credential Shares (15 items)
    await client.query(`
      INSERT INTO credential_shares (credential_id, shared_with, purpose, disclosed_fields, access_policy, status, expires_at) VALUES
      (1, 'did:web:employer.com', 'Employment verification', '["degree", "major", "graduation_date"]', '{"max_views": 5, "time_limit": "30d"}', 'active', NOW() + INTERVAL '30 days'),
      (2, 'did:web:bank.com', 'Loan application', '["position", "company", "start_date"]', '{"max_views": 3, "time_limit": "14d"}', 'active', NOW() + INTERVAL '14 days'),
      (3, 'did:web:airport.com', 'Travel verification', '["nationality", "id_number"]', '{"max_views": 1, "time_limit": "24h"}', 'active', NOW() + INTERVAL '1 day'),
      (4, 'did:web:pharmacy.com', 'Insurance verification', '["plan", "member_id"]', '{"max_views": 10, "time_limit": "90d"}', 'active', NOW() + INTERVAL '90 days'),
      (5, 'did:web:court.gov', 'Legal proceedings', '["license_type", "bar_number", "jurisdiction"]', '{"max_views": -1, "time_limit": "365d"}', 'active', NOW() + INTERVAL '365 days'),
      (6, 'did:web:rental.com', 'Car rental age verification', '["license_class", "state"]', '{"max_views": 1, "time_limit": "1h"}', 'expired', NOW() - INTERVAL '1 day'),
      (7, 'did:web:school.edu', 'Health requirement', '["vaccine", "doses"]', '{"max_views": 2, "time_limit": "7d"}', 'active', NOW() + INTERVAL '7 days'),
      (8, 'did:web:research-collab.org', 'Research collaboration', '["institution", "program"]', '{"max_views": 5, "time_limit": "60d"}', 'active', NOW() + INTERVAL '60 days'),
      (9, 'did:web:mortgage.com', 'Mortgage application', '["credit_score_range", "account_standing"]', '{"max_views": 3, "time_limit": "30d"}', 'active', NOW() + INTERVAL '30 days'),
      (10, 'did:web:contractor.gov', 'Clearance verification', '["level", "granted_date"]', '{"max_views": 1, "time_limit": "1h"}', 'active', NOW() + INTERVAL '1 hour'),
      (11, 'did:web:hospital.com', 'Physician verification', '["license_type", "specialty", "board_certified"]', '{"max_views": -1, "time_limit": "365d"}', 'active', NOW() + INTERVAL '365 days'),
      (12, 'did:web:client.com', 'Cloud architect verification', '["certification", "score"]', '{"max_views": 5, "time_limit": "30d"}', 'active', NOW() + INTERVAL '30 days'),
      (13, 'did:web:landlord.com', 'Rental application', '["city", "state", "verified_since"]', '{"max_views": 2, "time_limit": "14d"}', 'active', NOW() + INTERVAL '14 days'),
      (14, 'did:web:beneficiary.com', 'Life insurance claim', '["policy_type", "coverage_amount"]', '{"max_views": 3, "time_limit": "60d"}', 'active', NOW() + INTERVAL '60 days'),
      (15, 'did:web:conference.org', 'Conference registration', '["organization", "membership_type"]', '{"max_views": 1, "time_limit": "3d"}', 'active', NOW() + INTERVAL '3 days')
    `);
    console.log('Credential shares seeded');

    // 13. Presentation Requests (15 items)
    await client.query(`
      INSERT INTO presentation_requests (verifier, purpose, requested_credentials, constraints, status) VALUES
      ('Acme Corp HR', 'Employment onboarding', '[{"type": "UniversityDegree", "fields": ["degree", "major"]}, {"type": "GovernmentID", "fields": ["nationality"]}]', '{"trust_level": "high", "max_age_days": 365}', 'pending'),
      ('SecureBank Loans', 'Mortgage pre-approval', '[{"type": "EmploymentCredential", "fields": ["position", "company"]}, {"type": "FinancialCredential"}]', '{"trust_level": "high", "proof_type": "BbsBlsSignature2020"}', 'pending'),
      ('International Airport', 'Border control', '[{"type": "GovernmentID"}, {"type": "VaccinationRecord"}]', '{"trust_level": "sovereign", "real_time_verification": true}', 'fulfilled'),
      ('City Hospital', 'Patient admission', '[{"type": "HealthInsurance"}, {"type": "GovernmentID", "fields": ["full_name", "date_of_birth"]}]', '{"hipaa_compliant": true}', 'pending'),
      ('Law Firm Partners', 'Bar association check', '[{"type": "ProfessionalLicense", "fields": ["bar_number", "jurisdiction"]}]', '{"trust_level": "high", "real_time_status": true}', 'fulfilled'),
      ('Auto Dealership', 'Vehicle purchase', '[{"type": "DriverLicense"}, {"type": "FinancialCredential"}]', '{"max_age_days": 30}', 'pending'),
      ('University Admissions', 'Graduate application', '[{"type": "AcademicTranscript"}, {"type": "UniversityDegree"}]', '{"accredited_issuer": true}', 'pending'),
      ('Insurance Provider', 'Policy renewal', '[{"type": "GovernmentID"}, {"type": "HealthRecord"}]', '{"selective_disclosure": true}', 'expired'),
      ('Tech Conference', 'Speaker verification', '[{"type": "TrainingCertificate"}, {"type": "EmploymentCredential"}]', '{"trust_level": "medium"}', 'fulfilled'),
      ('Apartment Complex', 'Tenant screening', '[{"type": "EmploymentCredential"}, {"type": "ResidencyProof"}, {"type": "FinancialCredential"}]', '{"max_age_days": 60}', 'pending'),
      ('Military Base', 'Access clearance', '[{"type": "SecurityClearance"}, {"type": "GovernmentID"}]', '{"trust_level": "sovereign", "biometric_required": true}', 'fulfilled'),
      ('Online Marketplace', 'Seller verification', '[{"type": "GovernmentID", "fields": ["nationality"]}, {"type": "AddressProof"}]', '{"age_verification": true}', 'pending'),
      ('Research Institution', 'Collaboration access', '[{"type": "AcademicTranscript"}, {"type": "MembershipCredential"}]', '{"peer_reviewed": true}', 'pending'),
      ('Government Agency', 'Contractor clearance', '[{"type": "SecurityClearance"}, {"type": "EmploymentCredential"}, {"type": "GovernmentID"}]', '{"trust_level": "sovereign", "background_check": true}', 'pending'),
      ('Healthcare Network', 'Physician credentialing', '[{"type": "MedicalLicense"}, {"type": "UniversityDegree"}, {"type": "TrainingCertificate"}]', '{"board_verification": true}', 'fulfilled')
    `);
    console.log('Presentation requests seeded');

    // 14. Audit Logs (15 items)
    await client.query(`
      INSERT INTO audit_logs (action, entity_type, entity_id, actor, details, ip_address, ai_anomaly_flag) VALUES
      ('credential_issued', 'credential', 1, 'did:web:mit.edu', '{"credential_type": "UniversityDegree", "subject": "Alex"}', '192.168.1.100', false),
      ('identity_verified', 'identity', 1, 'system:ai-verifier', '{"method": "document_analysis", "confidence": 0.975}', '10.0.0.1', false),
      ('credential_revoked', 'credential', 5, 'did:web:bar-assoc.org', '{"reason": "license_suspended", "effective_immediately": true}', '172.16.0.50', false),
      ('presentation_created', 'presentation', 1, 'did:key:z6MkhaXg...', '{"verifier": "Acme Corp", "credentials_shared": 2}', '192.168.1.100', false),
      ('did_created', 'did', 1, 'system:did-resolver', '{"method": "key", "key_type": "Ed25519"}', '10.0.0.2', false),
      ('login_attempt', 'user', 1, 'admin@identity.io', '{"success": true, "mfa_used": true}', '203.0.113.50', false),
      ('credential_shared', 'share', 1, 'did:key:z6MkhaXg...', '{"shared_with": "did:web:employer.com", "fields_count": 3}', '192.168.1.100', false),
      ('risk_assessment', 'identity', 8, 'system:ai-risk', '{"previous_score": 35.0, "new_score": 42.0, "change_reason": "incomplete_docs"}', '10.0.0.3', true),
      ('compliance_check', 'credential', 9, 'system:compliance', '{"framework": "PCI-DSS", "result": "failed"}', '10.0.0.4', true),
      ('fraud_detected', 'identity', 1, 'system:ai-fraud', '{"alert_type": "geo_anomaly", "severity": "critical"}', '10.0.0.5', true),
      ('schema_updated', 'schema', 2, 'admin@identity.io', '{"version_from": "2.0.0", "version_to": "2.1.0", "fields_added": ["honors"]}', '192.168.1.100', false),
      ('trust_entry_added', 'trust', 15, 'admin@identity.io', '{"entity": "Blockchain Identity Foundation", "trust_level": "high"}', '192.168.1.100', false),
      ('bulk_verification', 'identity', null, 'system:batch-processor', '{"identities_processed": 150, "passed": 142, "failed": 8}', '10.0.0.6', false),
      ('key_rotation', 'did', 3, 'did:ion:EiAnKD8...', '{"old_key_id": "#key-1", "new_key_id": "#key-2", "reason": "scheduled_rotation"}', '10.0.0.7', false),
      ('suspicious_access', 'credential', 10, 'unknown', '{"attempts": 15, "source": "tor_exit_node", "blocked": true}', '198.51.100.1', true)
    `);
    console.log('Audit logs seeded');

    console.log('\n✅ All data seeded successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
