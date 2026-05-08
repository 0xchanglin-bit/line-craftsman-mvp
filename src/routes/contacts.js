const express = require('express');
const pool = require('../db/connection');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

// GET /api/case/:case_id/contacts  (需要認證)
router.get('/case/:case_id/contacts', verifyJWT, async (req, res) => {
  const caseId = parseInt(req.params.case_id);

  try {
    const [[caseRow]] = await pool.query(
      'SELECT id, creator_id FROM cases WHERE id = ?',
      [caseId]
    );
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });

    const [contacts] = await pool.query(
      `SELECT c.id, c.case_id, c.craftsman_id,
              u.name  AS craftsman_name,
              u.phone AS craftsman_phone,
              u.line_user_id AS craftsman_line_id,
              c.status, c.created_at
       FROM contacts c
       JOIN users u ON c.craftsman_id = u.id
       WHERE c.case_id = ?
       ORDER BY c.created_at DESC`,
      [caseId]
    );

    res.json(contacts);
  } catch (err) {
    console.error('[contacts/list]', err.message);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /api/case/:case_id/available-craftsmen  (不需認證)
router.get('/case/:case_id/available-craftsmen', async (req, res) => {
  const caseId = parseInt(req.params.case_id);

  try {
    const [[caseRow]] = await pool.query(
      'SELECT location_area, category FROM cases WHERE id = ?',
      [caseId]
    );
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });

    const [[skill]] = await pool.query(
      'SELECT id FROM service_skills WHERE name = ?',
      [caseRow.category]
    );
    if (!skill) return res.json([]);

    const [craftsmen] = await pool.query(
      `SELECT c.id, u.name, u.phone, c.average_rating, c.total_reviews
       FROM craftsmen c
       JOIN users u ON c.user_id = u.id
       WHERE JSON_CONTAINS(c.service_areas, JSON_ARRAY(?))
         AND JSON_CONTAINS(c.skills, JSON_ARRAY(?))
         AND c.is_verified = TRUE
         AND c.id NOT IN (
           SELECT craftsman_id FROM contacts WHERE case_id = ?
         )
       ORDER BY c.average_rating DESC
       LIMIT 10`,
      [caseRow.location_area, skill.id, caseId]
    );

    res.json(craftsmen);
  } catch (err) {
    console.error('[contacts/available]', err.message);
    res.status(500).json({ error: 'Failed to fetch available craftsmen' });
  }
});

// POST /api/case/:case_id/contact  (需要認證)
router.post('/case/:case_id/contact', verifyJWT, async (req, res) => {
  const caseId = parseInt(req.params.case_id);
  const { craftsman_id } = req.body;

  if (!craftsman_id) {
    return res.status(400).json({ error: 'craftsman_id is required' });
  }

  try {
    // 1. 案件存在且屬於請求者
    const [[caseRow]] = await pool.query(
      'SELECT id, creator_id FROM cases WHERE id = ?',
      [caseId]
    );
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    if (caseRow.creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 2. 師傅存在
    const [[craftsman]] = await pool.query(
      'SELECT id, user_id FROM craftsmen WHERE id = ?',
      [craftsman_id]
    );
    if (!craftsman) return res.status(404).json({ error: 'Craftsman not found' });

    // 3. 避免重複聯絡
    const [[existing]] = await pool.query(
      'SELECT id FROM contacts WHERE case_id = ? AND craftsman_id = ?',
      [caseId, craftsman_id]
    );
    if (existing) {
      return res.status(400).json({ error: 'Already contacted this craftsman' });
    }

    // 4. 建立 contacts 記錄
    const [insertResult] = await pool.query(
      `INSERT INTO contacts (case_id, seeker_id, craftsman_id, status)
       VALUES (?, ?, ?, 'pending')`,
      [caseId, req.user.userId, craftsman_id]
    );
    const contactId = insertResult.insertId;

    // 5. 查詢雙方聯絡資訊
    const [[seeker]] = await pool.query(
      'SELECT phone, line_user_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    const [[craftsmanUser]] = await pool.query(
      'SELECT phone, line_user_id FROM users WHERE id = ?',
      [craftsman.user_id]
    );

    // 6. 更新 contacts，填入聯絡資訊
    await pool.query(
      `UPDATE contacts
       SET seeker_phone       = ?,
           seeker_line_id     = ?,
           craftsman_phone    = ?,
           craftsman_line_id  = ?,
           status             = 'contacted'
       WHERE id = ?`,
      [
        seeker.phone,
        seeker.line_user_id,
        craftsmanUser.phone,
        craftsmanUser.line_user_id,
        contactId,
      ]
    );

    const [[contact]] = await pool.query(
      'SELECT * FROM contacts WHERE id = ?',
      [contactId]
    );

    res.json({
      success: true,
      message: '聯絡資訊已交換',
      contact,
    });
  } catch (err) {
    console.error('[contacts/create]', err.message);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

module.exports = router;
