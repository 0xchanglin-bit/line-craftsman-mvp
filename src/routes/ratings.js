const express = require('express');
const pool = require('../db/connection');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

// POST /api/ratings  (需要認證)
router.post('/ratings', verifyJWT, async (req, res) => {
  const { case_id, craftsman_id, score, comment } = req.body;

  if (!case_id || !craftsman_id || score == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Score must be between 1 and 5' });
  }

  try {
    // 案件存在且屬於請求者
    const [[caseRow]] = await pool.query(
      'SELECT id, creator_id FROM cases WHERE id = ?',
      [case_id]
    );
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    if (caseRow.creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 師傅存在，順帶取得 user_id（rated_craftsman_id FK → users.id）
    const [[craftsman]] = await pool.query(
      'SELECT id, user_id FROM craftsmen WHERE id = ?',
      [craftsman_id]
    );
    if (!craftsman) return res.status(404).json({ error: 'Craftsman not found' });

    // 該師傅曾聯絡過此案件
    const [[contact]] = await pool.query(
      'SELECT id FROM contacts WHERE case_id = ? AND craftsman_id = ?',
      [case_id, craftsman_id]
    );
    if (!contact) {
      return res.status(400).json({ error: 'This craftsman was not contacted for this case' });
    }

    // 防重複評分
    const [[existingRating]] = await pool.query(
      'SELECT id FROM ratings WHERE case_id = ? AND rater_id = ? AND rated_craftsman_id = ?',
      [case_id, req.user.userId, craftsman.user_id]
    );
    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this craftsman for this case' });
    }

    // 建立評分記錄
    const [insertResult] = await pool.query(
      `INSERT INTO ratings (case_id, rater_id, rated_craftsman_id, score, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [case_id, req.user.userId, craftsman.user_id, score, comment || null]
    );

    // 自動更新師傅評分統計
    const [[stats]] = await pool.query(
      'SELECT COUNT(*) AS total, AVG(score) AS avg_score FROM ratings WHERE rated_craftsman_id = ?',
      [craftsman.user_id]
    );
    const avgRating = parseFloat(parseFloat(stats.avg_score).toFixed(2));
    await pool.query(
      'UPDATE craftsmen SET average_rating = ?, total_reviews = ? WHERE id = ?',
      [avgRating, stats.total, craftsman_id]
    );

    const [[rating]] = await pool.query(
      'SELECT * FROM ratings WHERE id = ?',
      [insertResult.insertId]
    );

    res.status(201).json({
      success: true,
      message: '評分已提交',
      rating: {
        id: rating.id,
        case_id: rating.case_id,
        craftsman_id,
        score: rating.score,
        comment: rating.comment,
        created_at: rating.created_at,
      },
      craftsman_updated: {
        average_rating: avgRating,
        total_reviews: Number(stats.total),
      },
    });
  } catch (err) {
    console.error('[ratings/post]', err.message);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET /api/craftsman/:id/ratings  (不需認證)
router.get('/craftsman/:id/ratings', async (req, res) => {
  const craftsmanId = parseInt(req.params.id);

  try {
    const [[craftsman]] = await pool.query(
      'SELECT id, user_id, average_rating, total_reviews FROM craftsmen WHERE id = ?',
      [craftsmanId]
    );
    if (!craftsman) return res.status(404).json({ error: 'Craftsman not found' });

    const [reviews] = await pool.query(
      `SELECT r.id, r.case_id, r.score, r.comment,
              c.category AS case_category, c.location_area,
              r.created_at
       FROM ratings r
       JOIN cases c ON r.case_id = c.id
       WHERE r.rated_craftsman_id = ?
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [craftsman.user_id]
    );

    // 分數分佈
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { distribution[r.score] = (distribution[r.score] || 0) + 1; });

    res.json({
      craftsman_id: craftsmanId,
      average_rating: craftsman.average_rating,
      total_reviews: craftsman.total_reviews,
      rating_distribution: distribution,
      reviews,
    });
  } catch (err) {
    console.error('[ratings/get]', err.message);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

module.exports = router;
