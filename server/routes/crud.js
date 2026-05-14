const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../openrouter');
const authenticateToken = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// Tables that use paginated responses
const PAGINATED_TABLES = ['digital_identities', 'verifiable_credentials', 'audit_logs'];

// Identifier-safe validation to prevent SQL injection via dynamic identifiers
const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
function safeIdent(name) {
  if (!IDENT_RE.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return name;
}

// Reject overly large or non-object payloads
function validateBody(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE') return next();
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }
  const keys = Object.keys(req.body);
  if (keys.length === 0) return res.status(400).json({ error: 'Request body is empty' });
  if (keys.length > 50) return res.status(400).json({ error: 'Too many fields in body' });
  for (const k of keys) {
    if (!IDENT_RE.test(k)) return res.status(400).json({ error: `Invalid field name: ${k}` });
  }
  next();
}

function createCrudRouter(tableName, aiPromptFn, displayName) {
  const router = express.Router();
  const safeTable = safeIdent(tableName);

  // All routes require authentication
  router.use(authenticateToken);
  router.use(validateBody);

  // GET all
  router.get('/', async (req, res) => {
    try {
      if (PAGINATED_TABLES.includes(tableName)) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const countResult = await pool.query(`SELECT COUNT(*) FROM ${safeTable}`);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
          `SELECT * FROM ${safeTable} ORDER BY id DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        );

        return res.json({
          data: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }

      const result = await pool.query(`SELECT * FROM ${safeTable} ORDER BY id DESC`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${safeTable} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${safeTable} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const result = await pool.query(
        `UPDATE ${safeTable} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      // Some tables don't have updated_at
      try {
        const keys = Object.keys(req.body);
        const values = Object.values(req.body);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const result = await pool.query(
          `UPDATE ${safeTable} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
          [...values, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
      } catch (err2) {
        res.status(500).json({ error: err2.message });
      }
    }
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${safeTable} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: `${displayName} deleted successfully`, deleted: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI analyze (rate-limited; persists result + writes back trust score where applicable)
  router.post('/:id/ai-analyze', aiRateLimiter, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${safeTable} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const item = result.rows[0];
      const prompt = aiPromptFn(item);
      const aiResult = await callOpenRouter(prompt);

      // Persist AI result to ai_results JSONB store
      try {
        await pool.query(
          `INSERT INTO ai_results (entity_type, entity_id, analysis_type, content, ai_model, prompt_used)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [safeTable, item.id, 'crud_analyze', aiResult.content || '', aiResult.model || null, prompt.slice(0, 2000)]
        );
      } catch (e) {
        // ai_results table may not exist on older deployments; non-fatal
      }

      // Write-back: extract trust score from AI text and persist to digital_identities.ai_trust_score
      if (safeTable === 'digital_identities' && aiResult.content) {
        const m = aiResult.content.match(/(?:Trust(?:worthiness)?\s*Score|Verification\s*Score|Validity\s*Score|Score)\s*[:\-]?\s*(\d{1,3})/i);
        if (m) {
          const score = Math.min(100, Math.max(0, parseInt(m[1])));
          try {
            await pool.query('UPDATE digital_identities SET ai_trust_score = $1 WHERE id = $2', [score, item.id]);
            item.ai_trust_score = score;
          } catch (e) { /* ignore */ }
        }
      }

      res.json({ item, ai_analysis: aiResult });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
