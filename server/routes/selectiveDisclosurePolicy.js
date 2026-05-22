const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { policies: 18, overdisclosure_flags: 5, verifier_reviews: 4, privacy_savings: 11 },
    policies: [
      { credential: 'Employment VC', verifier: 'Loan provider', fields: ['employer', 'employment_status'], removed: ['salary_history'], risk: 'low' },
      { credential: 'Age Proof', verifier: 'Venue app', fields: ['over_21'], removed: ['birthdate', 'address'], risk: 'low' },
      { credential: 'Education VC', verifier: 'Recruiter', fields: ['degree', 'graduation_year'], removed: ['student_id'], risk: 'medium' },
    ],
  });
});

router.post('/evaluate', (req, res) => {
  const { requestedFields = [] } = req.body || {};
  const sensitive = requestedFields.filter((field) => ['birthdate', 'address', 'salary_history', 'student_id'].includes(field));
  res.json({ overdisclosure: sensitive.length > 0, sensitive, recommendation: sensitive.length ? 'replace with derived proof or remove field' : 'policy is minimal' });
});

module.exports = router;
