const { messagingApi } = require('@line/bot-sdk');
const pool = require('../db/connection');

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

function buildFlexMessage(caseData) {
  const { id, location_area, category, description, budget_min, budget_max } = caseData;
  const liffUrl = process.env.LIFF_URL || 'https://your-liff-url.com';

  const budgetBox = budget_min && budget_max
    ? {
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
          { type: 'text', text: '預算', color: '#aaaaaa', size: 'sm', flex: 1 },
          { type: 'text', text: `${budget_min} - ${budget_max} 元`, wrap: true, color: '#666666', size: 'sm', flex: 5 },
        ],
      }
    : null;

  const bodyContents = [
    {
      type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: '服務', color: '#aaaaaa', size: 'sm', flex: 1 },
        { type: 'text', text: category, wrap: true, color: '#666666', size: 'sm', flex: 5 },
      ],
    },
    {
      type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: '位置', color: '#aaaaaa', size: 'sm', flex: 1 },
        { type: 'text', text: location_area, wrap: true, color: '#666666', size: 'sm', flex: 5 },
      ],
    },
    budgetBox,
    {
      type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: '描述', color: '#aaaaaa', size: 'sm', flex: 1 },
        {
          type: 'text',
          text: description.length > 50 ? description.substring(0, 50) + '...' : description,
          wrap: true,
          color: '#666666',
          size: 'sm',
          flex: 5,
        },
      ],
    },
  ].filter(Boolean);

  return {
    type: 'flex',
    altText: `新案件 - ${category}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#FF6B6B',
        contents: [
          { type: 'text', text: '🔔 新案件', size: 'xl', weight: 'bold', color: '#FFFFFF' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: bodyContents,
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#FF6B6B',
            action: {
              type: 'uri',
              label: '查看詳情',
              uri: `${liffUrl}/case/${id}`,
            },
          },
        ],
      },
    },
  };
}

async function broadcastCaseToMatchingCraftsmen(caseId, { location_area, category, description, budget_min, budget_max }) {
  let sent_count = 0;
  let failed_count = 0;
  const craftsmen_notified = [];

  try {
    // 1. 取得 skill_id
    const [[skill]] = await pool.query(
      'SELECT id FROM service_skills WHERE name = ?',
      [category]
    );
    if (!skill) {
      return { success: false, error: 'Invalid category', sent_count: 0, failed_count: 0 };
    }

    // 2. 查詢符合地區 + 技能的已驗證師傅
    const [craftsmen] = await pool.query(
      `SELECT c.id AS craftsman_id, u.id AS user_id, u.line_user_id, u.name, u.phone, c.average_rating
       FROM craftsmen c
       JOIN users u ON c.user_id = u.id
       WHERE JSON_CONTAINS(c.service_areas, JSON_ARRAY(?))
         AND JSON_CONTAINS(c.skills, JSON_ARRAY(?))
         AND c.is_verified = TRUE
       ORDER BY c.average_rating DESC
       LIMIT 10`,
      [location_area, skill.id]
    );

    if (craftsmen.length === 0) {
      return { success: true, sent_count: 0, failed_count: 0, message: 'No matching craftsmen found' };
    }

    // 3. 推播
    const caseData = { id: caseId, location_area, category, description, budget_min, budget_max };
    const flexMessage = buildFlexMessage(caseData);

    for (const { craftsman_id, line_user_id, name, phone } of craftsmen) {
      try {
        await lineClient.pushMessage({ to: line_user_id, messages: [flexMessage] });

        await pool.query(
          `INSERT INTO broadcast_logs (case_id, craftsman_id, line_user_id, status, created_at)
           VALUES (?, ?, ?, 'sent', NOW())`,
          [caseId, craftsman_id, line_user_id]
        );

        craftsmen_notified.push({ id: craftsman_id, name, phone });
        sent_count++;
      } catch (err) {
        await pool.query(
          `INSERT INTO broadcast_logs (case_id, craftsman_id, line_user_id, status, error_message, created_at)
           VALUES (?, ?, ?, 'failed', ?, NOW())`,
          [caseId, craftsman_id, line_user_id, err.message]
        );

        console.error(`推播失敗 (${name}):`, err.message);
        failed_count++;
      }
    }

    return { success: true, sent_count, failed_count, craftsmen_notified };
  } catch (err) {
    console.error('[broadcast] unexpected error:', err.message);
    return { success: false, error: 'Database error', sent_count, failed_count };
  }
}

module.exports = broadcastCaseToMatchingCraftsmen;
