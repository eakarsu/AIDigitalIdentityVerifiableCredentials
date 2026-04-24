const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../openrouter');

function createCrudRouter(tableName, aiPromptFn, displayName) {
  const router = express.Router();

  // GET all
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
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
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
        `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
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
          `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
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
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: `${displayName} deleted successfully`, deleted: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI analyze
  router.post('/:id/ai-analyze', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const item = result.rows[0];
      const prompt = aiPromptFn(item);
      const aiResult = await callOpenRouter(prompt);
      res.json({ item, ai_analysis: aiResult });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
