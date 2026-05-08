const express = require('express');
const pool = require('../db/connection');
const { verifyJWT } = require('../middleware/auth');

const VALID_SKILL_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

// ── /api/skills ───────────────────────────────────────────────

const skillsRouter = express.Router();

// GET /api/skills
skillsRouter.get('/', async (req, res) => {
  try {
    const [skills] = await pool.query(
      `SELECT id, name, category, description
       FROM service_skills
       WHERE is_active = TRUE
       ORDER BY category ASC, id ASC`
    );
    res.json(skills);
  } catch (err) {
    console.error('[skills/list]', err.message);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// ── /api/craftsman ────────────────────────────────────────────

const craftsmanRouter = express.Router();

// GET /api/craftsman/profile  (需要認證，依 JWT 識別師傅)
craftsmanRouter.get('/profile', verifyJWT, async (req, res) => {
  try {
    const [[craftsman]] = await pool.query(
      'SELECT id, user_id, skills, service_areas, is_verified FROM craftsmen WHERE user_id = ?',
      [req.user.userId]
    );
    if (!craftsman) {
      return res.status(404).json({ error: 'Craftsman not found' });
    }

    const toArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try { return JSON.parse(val); } catch { return []; }
    };

    res.json({
      id:            craftsman.id,
      user_id:       craftsman.user_id,
      skills:        toArray(craftsman.skills),
      service_areas: toArray(craftsman.service_areas),
      is_verified:   craftsman.is_verified,
    });
  } catch (err) {
    console.error('[craftsman/profile]', err.message);
    res.status(500).json({ error: 'Failed to fetch craftsman profile' });
  }
});

// GET /api/craftsman/:id/skills
craftsmanRouter.get('/:id/skills', async (req, res) => {
  const craftsmanId = parseInt(req.params.id);

  try {
    const [[craftsman]] = await pool.query(
      'SELECT id, skills FROM craftsmen WHERE id = ?',
      [craftsmanId]
    );
    if (!craftsman) {
      return res.status(404).json({ error: 'Craftsman not found' });
    }

    const skillIds = Array.isArray(craftsman.skills) ? craftsman.skills : [];

    if (skillIds.length === 0) {
      return res.json({ craftsman_id: craftsmanId, skills: [] });
    }

    const placeholders = skillIds.map(() => '?').join(', ');
    const [skills] = await pool.query(
      `SELECT id, name, category, description
       FROM service_skills
       WHERE id IN (${placeholders})
       ORDER BY category ASC`,
      skillIds
    );

    res.json({ craftsman_id: craftsmanId, skills });
  } catch (err) {
    console.error('[craftsman/skills/get]', err.message);
    res.status(500).json({ error: 'Failed to fetch craftsman skills' });
  }
});

// POST /api/craftsman/:id/skills  (需要認證)
craftsmanRouter.post('/:id/skills', verifyJWT, async (req, res) => {
  const craftsmanId = parseInt(req.params.id);
  const { skill_ids } = req.body;

  if (!Array.isArray(skill_ids) || skill_ids.length === 0) {
    return res.status(400).json({ error: 'Invalid skill IDs' });
  }
  if (skill_ids.some(id => !VALID_SKILL_IDS.has(id))) {
    return res.status(400).json({ error: 'Invalid skill IDs' });
  }

  try {
    const [[craftsman]] = await pool.query(
      'SELECT id FROM craftsmen WHERE id = ?',
      [craftsmanId]
    );
    if (!craftsman) {
      return res.status(404).json({ error: 'Craftsman not found' });
    }

    await pool.query(
      'UPDATE craftsmen SET skills = ? WHERE id = ?',
      [JSON.stringify(skill_ids), craftsmanId]
    );

    const placeholders = skill_ids.map(() => '?').join(', ');
    const [skills] = await pool.query(
      `SELECT id, name, category
       FROM service_skills
       WHERE id IN (${placeholders})
       ORDER BY category ASC`,
      skill_ids
    );

    res.json({
      success: true,
      message: '技能已更新',
      craftsman_id: craftsmanId,
      skills,
    });
  } catch (err) {
    console.error('[craftsman/skills/post]', err.message);
    res.status(500).json({ error: 'Failed to update skills' });
  }
});

module.exports = { skillsRouter, craftsmanRouter };
