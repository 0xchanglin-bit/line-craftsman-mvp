const express   = require('express');
const path      = require('path');
const multer    = require('multer');
const rateLimit = require('express-rate-limit');
const { messagingApi } = require('@line/bot-sdk');
const pool = require('../db/connection');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

// ── 速率限制：同一 IP 1 分鐘最多 10 次上傳 ───────────────
const uploadLimiter = rateLimit({
  windowMs:         60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: '上傳過於頻繁，請稍後再試' },
});

// ── Multer：上傳到 public/uploads/craftsman/ ─────────────
const MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png' };

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/uploads/craftsman'),
  filename: (req, file, cb) => {
    // Extension from mimetype only — never trust original filename
    const ext  = MIME_TO_EXT[file.mimetype] || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) cb(null, true);
    else cb(Object.assign(new Error('INVALID_TYPE'), { code: 'INVALID_TYPE' }));
  },
});

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// ── Middleware: 僅管理員可用 ──────────────────────────────
const verifyAdmin = async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );
    if (!user?.is_admin) return res.status(403).json({ error: 'Admin only' });
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// ── 傳送 LINE 通知給申請者 ──────────────────────────────
async function notifyApplicant(userId, text) {
  try {
    const [[u]] = await pool.query('SELECT line_user_id FROM users WHERE id = ?', [userId]);
    if (!u?.line_user_id) return;
    await lineClient.pushMessage({
      to: u.line_user_id,
      messages: [{ type: 'text', text }],
    });
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}

// ── 通知管理員有新申請 ──────────────────────────────────
async function notifyAdmin(name) {
  try {
    const [admins] = await pool.query(
      'SELECT line_user_id FROM users WHERE is_admin = TRUE AND line_user_id IS NOT NULL'
    );
    const text = `📋 新師傅認證申請\n申請人：${name}\n請前往後台審核。`;
    for (const { line_user_id } of admins) {
      await lineClient.pushMessage({
        to: line_user_id,
        messages: [{ type: 'text', text }],
      });
    }
  } catch (err) {
    console.error('[notify-admin] failed:', err.message);
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/craftsman/upload-file  上傳圖片（名片 / 證照）
// ─────────────────────────────────────────────────────────
const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: '檔案大小超過 5MB 限制',
  INVALID_TYPE:    '僅支援 JPG / PNG 格式',
};

router.post('/upload-file', uploadLimiter, verifyJWT, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = UPLOAD_ERRORS[err.code] || '上傳失敗，請重試';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: '未收到檔案' });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const url = `${baseUrl}/uploads/craftsman/${req.file.filename}`;
    res.json({ url });
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/craftsman/apply  師傅提交認證申請
// ─────────────────────────────────────────────────────────
router.post('/apply', verifyJWT, async (req, res) => {
  const { name, phone, lineId, serviceAreas, skills, businessCardUrl, licenseImageUrl } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: '請填寫名稱' });
  if (!phone && !lineId) return res.status(400).json({ error: '請填寫電話或 LINE ID' });
  if (!Array.isArray(serviceAreas) || serviceAreas.length === 0)
    return res.status(400).json({ error: '請至少選擇一個服務地區' });
  if (!Array.isArray(skills) || skills.length === 0)
    return res.status(400).json({ error: '請至少選擇一項服務技能' });
  if (!businessCardUrl) return res.status(400).json({ error: '請上傳名片照片' });

  try {
    // 檢查是否已申請（UNIQUE user_id）
    const [[existing]] = await pool.query(
      'SELECT id, status FROM craftsman_applications WHERE user_id = ?',
      [req.user.userId]
    );

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ error: '已有待審核的申請，請耐心等候' });
      }
      if (existing.status === 'approved') {
        return res.status(409).json({ error: '你的師傅資格已通過，無需重複申請' });
      }
      // rejected / revision_needed → 更新舊記錄
      await pool.query(
        `UPDATE craftsman_applications
         SET name=?, phone=?, line_id=?, service_areas=?, skills=?,
             business_card_url=?, license_image_url=?,
             status='pending', rejection_reason=NULL, created_at=NOW()
         WHERE user_id=?`,
        [
          name.trim(), phone || null, lineId || null,
          JSON.stringify(serviceAreas), JSON.stringify(skills),
          businessCardUrl, licenseImageUrl || null,
          req.user.userId,
        ]
      );
      await notifyAdmin(name.trim());
      return res.json({ success: true, applicationId: existing.id, status: 'pending', message: '申請已重新提交' });
    }

    const [result] = await pool.query(
      `INSERT INTO craftsman_applications
         (user_id, name, phone, line_id, service_areas, skills, business_card_url, license_image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId, name.trim(), phone || null, lineId || null,
        JSON.stringify(serviceAreas), JSON.stringify(skills),
        businessCardUrl, licenseImageUrl || null,
      ]
    );

    await notifyAdmin(name.trim());

    res.status(201).json({
      success: true,
      applicationId: result.insertId,
      status: 'pending',
      message: '申請已提交，等待審核',
    });
  } catch (err) {
    console.error('[apply]', err.message);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/craftsman/application-status  查詢自己的申請狀態
// ─────────────────────────────────────────────────────────
router.get('/application-status', verifyJWT, async (req, res) => {
  try {
    const [[app]] = await pool.query(
      `SELECT id, status, rejection_reason, created_at, approved_at
       FROM craftsman_applications WHERE user_id = ?`,
      [req.user.userId]
    );
    if (!app) return res.status(404).json({ error: 'No application found' });
    res.json(app);
  } catch (err) {
    console.error('[application-status]', err.message);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/applications  管理員：取得待審核申請列表
// ─────────────────────────────────────────────────────────
router.get('/admin/applications', verifyJWT, verifyAdmin, async (req, res) => {
  const { status = 'pending' } = req.query;
  try {
    const [apps] = await pool.query(
      `SELECT id, user_id, name, phone, line_id, service_areas, skills,
              business_card_url, license_image_url, status, rejection_reason, created_at
       FROM craftsman_applications
       WHERE status = ?
       ORDER BY created_at DESC`,
      [status]
    );
    res.json(apps);
  } catch (err) {
    console.error('[admin/applications]', err.message);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/applications/:id/approve  通過申請
// ─────────────────────────────────────────────────────────
router.patch('/admin/applications/:id/approve', verifyJWT, verifyAdmin, async (req, res) => {
  const appId = parseInt(req.params.id);
  try {
    const [[app]] = await pool.query(
      'SELECT * FROM craftsman_applications WHERE id = ?',
      [appId]
    );
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status === 'approved') return res.status(400).json({ error: '已通過，無需重複操作' });

    // 更新申請狀態
    await pool.query(
      "UPDATE craftsman_applications SET status='approved', approved_at=NOW() WHERE id=?",
      [appId]
    );

    // 建立或更新 craftsmen 記錄
    const [[existing]] = await pool.query(
      'SELECT id FROM craftsmen WHERE user_id = ?', [app.user_id]
    );

    // safe parse：MySQL JSON 欄位可能已自動解析成 array
    const toJsonStr = (val) => {
      if (!val) return '[]';
      if (typeof val === 'string') return val;
      return JSON.stringify(val);
    };
    const skillsJson       = toJsonStr(app.skills);
    const serviceAreasJson = toJsonStr(app.service_areas);

    if (!existing) {
      await pool.query(
        `INSERT INTO craftsmen (user_id, skills, service_areas, is_verified, average_rating, total_reviews)
         VALUES (?, ?, ?, TRUE, 0, 0)`,
        [app.user_id, skillsJson, serviceAreasJson]
      );
    } else {
      await pool.query(
        `UPDATE craftsmen SET skills=?, service_areas=?, is_verified=TRUE WHERE user_id=?`,
        [skillsJson, serviceAreasJson, app.user_id]
      );
    }

    // 更新 users 表聯絡資訊
    if (app.phone || app.line_id) {
      await pool.query(
        'UPDATE users SET phone=COALESCE(?, phone), name=? WHERE id=?',
        [app.phone, app.name, app.user_id]
      );
    }

    // LINE 通知
    await notifyApplicant(
      app.user_id,
      `✅ 恭喜！你的師傅驗證申請已通過！\n你現在可以開始接收案件推播了。`
    );

    res.json({ success: true, message: '已通過申請並建立師傅帳號' });
  } catch (err) {
    console.error('[admin/approve] error:', err);
    res.status(500).json({ error: 'Failed to approve application', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/applications/:id/reject  拒絕申請
// ─────────────────────────────────────────────────────────
router.patch('/admin/applications/:id/reject', verifyJWT, verifyAdmin, async (req, res) => {
  const appId = parseInt(req.params.id);
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: '請填寫拒絕原因' });

  try {
    const [[app]] = await pool.query(
      'SELECT user_id FROM craftsman_applications WHERE id = ?', [appId]
    );
    if (!app) return res.status(404).json({ error: 'Application not found' });

    await pool.query(
      "UPDATE craftsman_applications SET status='rejected', rejection_reason=? WHERE id=?",
      [reason.trim(), appId]
    );

    await notifyApplicant(
      app.user_id,
      `❌ 很遺憾，你的師傅認證申請未通過。\n原因：${reason.trim()}\n\n你可以修改後重新提交申請。`
    );

    res.json({ success: true, message: '已拒絕申請' });
  } catch (err) {
    console.error('[admin/reject]', err.message);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/applications/:id/revision  需補充資訊
// ─────────────────────────────────────────────────────────
router.patch('/admin/applications/:id/revision', verifyJWT, verifyAdmin, async (req, res) => {
  const appId = parseInt(req.params.id);
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: '請填寫需補充的說明' });

  try {
    const [[app]] = await pool.query(
      'SELECT user_id FROM craftsman_applications WHERE id = ?', [appId]
    );
    if (!app) return res.status(404).json({ error: 'Application not found' });

    await pool.query(
      "UPDATE craftsman_applications SET status='revision_needed', rejection_reason=? WHERE id=?",
      [reason.trim(), appId]
    );

    await notifyApplicant(
      app.user_id,
      `⚠️ 你的師傅認證申請需要補充資訊。\n說明：${reason.trim()}\n\n請重新提交申請並補充所需資料。`
    );

    res.json({ success: true, message: '已標記需補充資訊' });
  } catch (err) {
    console.error('[admin/revision]', err.message);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;
