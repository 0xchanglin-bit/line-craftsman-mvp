const express = require('express');
const pool = require('../db/connection');
const { verifyJWT } = require('../middleware/auth');

const broadcastToMatching = require('../utils/broadcast');

const router = express.Router();

// POST /api/cases - 建立案件
router.post('/', verifyJWT, async (req, res) => {
  const { location_area, category, description, budget_min, budget_max } = req.body;

  if (!location_area || !category || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [[skill]] = await pool.query(
      'SELECT id FROM service_skills WHERE name = ?',
      [category]
    );
    if (!skill) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const [result] = await pool.query(
      `INSERT INTO cases (creator_id, location_area, category, description, budget_min, budget_max, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        req.user.userId,
        location_area,
        category,
        description,
        budget_min ?? null,
        budget_max ?? null,
      ]
    );

    const caseId = result.insertId;

    // 自動推播
    let broadcast_status = { sent_count: 0, failed_count: 0 };
    try {
      broadcast_status = await broadcastToMatching(caseId, {
        location_area,
        category,
        description,
        budget_min: budget_min ?? null,
        budget_max: budget_max ?? null,
      });
    } catch (err) {
      console.error('[cases] broadcast error:', err.message);
    }

    res.status(201).json({
      success: true,
      case_id: caseId,
      message: '案件已發起',
      broadcast_status,
    });
  } catch (err) {
    console.error('[cases/post]', err.message);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// GET /api/cases - 登入用戶的案件清單
router.get('/', verifyJWT, async (req, res) => {
  const { status } = req.query;

  try {
    const params = [req.user.userId];
    let sql = `SELECT id, location_area, category, description, status, created_at,
                      (SELECT COUNT(*) FROM contacts WHERE case_id = cases.id) AS craftsmen_count
               FROM cases WHERE creator_id = ?`;

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const [cases] = await pool.query(sql, params);
    res.json(cases);
  } catch (err) {
    console.error('[cases/list]', err.message);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// GET /api/cases/:id - 案件詳情 + 聯絡的師傅
router.get('/:id', async (req, res) => {
  const caseId = parseInt(req.params.id);

  try {
    const [[caseRow]] = await pool.query(
      'SELECT * FROM cases WHERE id = ?',
      [caseId]
    );
    if (!caseRow) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const [contacts] = await pool.query(
      `SELECT c.id, u.name, u.phone, u.line_user_id AS line_id, c.status
       FROM contacts c
       JOIN users u ON u.id = c.craftsman_id
       WHERE c.case_id = ?`,
      [caseId]
    );

    res.json({ ...caseRow, craftsmen: contacts });
  } catch (err) {
    console.error('[cases/get]', err.message);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// PATCH /api/cases/:id/cancel - 取消案件並刪除相關聯絡記錄
router.patch('/:id/cancel', verifyJWT, async (req, res) => {
  const caseId = parseInt(req.params.id);
  try {
    const [[caseRow]] = await pool.query(
      'SELECT id, creator_id, status FROM cases WHERE id = ?', [caseId]
    );
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    if (caseRow.creator_id !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    if (caseRow.status === 'cancelled') return res.status(400).json({ error: '案件已取消' });

    await pool.query('DELETE FROM contacts WHERE case_id = ?', [caseId]);
    await pool.query('UPDATE cases SET status = ? WHERE id = ?', ['cancelled', caseId]);

    res.json({ success: true, message: '案件已取消', case_id: caseId });
  } catch (err) {
    console.error('[cases/cancel]', err.message);
    res.status(500).json({ error: 'Failed to cancel case' });
  }
});

// PATCH /api/cases/:id/rebroadcast - 重新廣播案件給符合師傅
router.patch('/:id/rebroadcast', verifyJWT, async (req, res) => {
  const caseId = parseInt(req.params.id);
  try {
    const [[caseRow]] = await pool.query(
      'SELECT id, creator_id, location_area, category, description, budget_min, budget_max, status FROM cases WHERE id = ?',
      [caseId]
    );
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    if (caseRow.creator_id !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    if (caseRow.status === 'cancelled') return res.status(400).json({ error: '已取消的案件無法重新協尋' });

    // 重設為 active 並重新推播
    await pool.query("UPDATE cases SET status = 'active' WHERE id = ?", [caseId]);

    let broadcast_status = { sent_count: 0, failed_count: 0 };
    try {
      broadcast_status = await broadcastToMatching(caseId, {
        location_area: caseRow.location_area,
        category:      caseRow.category,
        description:   caseRow.description,
        budget_min:    caseRow.budget_min,
        budget_max:    caseRow.budget_max,
      });
    } catch (err) {
      console.error('[cases/rebroadcast] broadcast error:', err.message);
    }

    res.json({ success: true, message: '已重新協尋', broadcast_status });
  } catch (err) {
    console.error('[cases/rebroadcast]', err.message);
    res.status(500).json({ error: 'Failed to rebroadcast' });
  }
});

// PATCH /api/cases/:id - 更新案件狀態
router.patch('/:id', verifyJWT, async (req, res) => {
  const caseId = parseInt(req.params.id);
  const { status } = req.body;

  const VALID_STATUSES = ['active', 'matched', 'completed', 'cancelled'];
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [[caseRow]] = await pool.query(
      'SELECT id, creator_id FROM cases WHERE id = ?',
      [caseId]
    );
    if (!caseRow) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (caseRow.creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const completedAt = status === 'completed' ? new Date() : null;

    await pool.query(
      'UPDATE cases SET status = ?, completed_at = ? WHERE id = ? AND creator_id = ?',
      [status, completedAt, caseId, req.user.userId]
    );

    res.json({
      success: true,
      message: '案件已更新',
      case: { id: caseId, status, completed_at: completedAt },
    });
  } catch (err) {
    console.error('[cases/patch]', err.message);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

module.exports = router;
