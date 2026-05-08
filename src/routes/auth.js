const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
// LIFF 前端取得 profile 後呼叫此端點，回傳 JWT
router.post('/login', async (req, res) => {
  const { lineUserId, displayName, pictureUrl } = req.body;

  if (!lineUserId) {
    return res.status(400).json({ error: 'lineUserId is required' });
  }

  try {
    // 建立或更新使用者
    await pool.query(
      `INSERT INTO users (line_user_id, name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = IF(name IS NULL, VALUES(name), name)`,
      [lineUserId, displayName || null]
    );

    const [[user]] = await pool.query(
      `SELECT u.id, u.line_user_id, u.name, u.phone, u.role, u.is_admin,
              c.id AS craftsman_id
       FROM users u
       LEFT JOIN craftsmen c ON c.user_id = u.id
       WHERE u.line_user_id = ?`,
      [lineUserId]
    );

    const token = jwt.sign(
      { userId: user.id, lineUserId: user.line_user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me  (需要 JWT)
router.get('/me', verifyJWT, async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.line_user_id, u.name, u.phone, u.role, u.is_admin, u.created_at,
              c.id AS craftsman_id
       FROM users u
       LEFT JOIN craftsmen c ON c.user_id = u.id
       WHERE u.id = ?`,
      [req.user.userId]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('[auth/me]', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/profile  (需要 JWT，更新電話/姓名)
router.put('/profile', verifyJWT, async (req, res) => {
  const { name, phone } = req.body;

  if (!name && !phone) {
    return res.status(400).json({ error: 'name or phone is required' });
  }

  try {
    await pool.query(
      `UPDATE users
       SET name  = COALESCE(?, name),
           phone = COALESCE(?, phone)
       WHERE id = ?`,
      [name || null, phone || null, req.user.userId]
    );

    const [[user]] = await pool.query(
      `SELECT u.id, u.line_user_id, u.name, u.phone, u.role, u.is_admin,
              c.id AS craftsman_id
       FROM users u
       LEFT JOIN craftsmen c ON c.user_id = u.id
       WHERE u.id = ?`,
      [req.user.userId]
    );

    res.json({ user });
  } catch (err) {
    console.error('[auth/profile]', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
