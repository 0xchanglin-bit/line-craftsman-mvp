require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
const SERVICE_SKILLS = require('../src/config/service_skills');

const CSV_PATH = path.join(__dirname, '../uploads/師傅資料表 (回覆) - 表單回覆 1.csv');

// 技能名稱 → ID 對應表
const SKILL_MAP = new Map(SERVICE_SKILLS.map(s => [s.name, s.id]));

function parseSkillIds(raw) {
  if (!raw || !raw.trim()) return [];
  return raw.split(',')
    .map(s => s.trim())
    .filter(s => SKILL_MAP.has(s))
    .map(s => SKILL_MAP.get(s));
}

function parseAreas(raw) {
  if (!raw || !raw.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function readCSV() {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(CSV_PATH, { encoding: 'utf8' })
      .pipe(csv())
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  console.log('👷 開始匯入師傅資料...');

  let successCount = 0;
  let skipCount = 0;
  let failureCount = 0;
  const failures = [];

  let rows;
  try {
    rows = await readCSV();
  } catch (err) {
    console.error('❌ 讀取 CSV 失敗:', err.message);
    await pool.end();
    process.exit(1);
  }

  for (const row of rows) {
    const name      = (row['姓名 / 暱稱'] || '').trim();
    const phone     = (row['聯絡電話(限填一組)'] || '').trim();
    const rawLineId = (row['Line ID (選填)'] || '').trim();
    const rawAreas  = row['服務地區'] || '';
    const rawSkills = row['專長項目'] || '';

    if (!name || !phone) {
      console.warn(`⚠️ 跳過 ${name || '(無名)'}: 缺少必填欄位 name/phone`);
      skipCount++;
      continue;
    }

    const skillIds = parseSkillIds(rawSkills);
    if (skillIds.length === 0) {
      console.warn(`⚠️ 跳過 ${name}: 無有效技能項目`);
      skipCount++;
      continue;
    }

    const lineUserId = rawLineId || `phone_${phone}`;
    const serviceAreas = parseAreas(rawAreas);

    try {
      // 1. 插入或更新 users
      const [userResult] = await pool.query(
        `INSERT INTO users (line_user_id, name, phone, role)
         VALUES (?, ?, ?, 'craftsman')
         ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), role = 'craftsman'`,
        [lineUserId, name, phone]
      );

      const userId = userResult.insertId || (
        await pool.query('SELECT id FROM users WHERE line_user_id = ?', [lineUserId])
      ).then(([r]) => r[0].id);

      // insertId 為 0 時代表 ON DUPLICATE KEY — 重新查詢取得真正的 id
      let realUserId = userResult.insertId;
      if (!realUserId) {
        const [[existing]] = await pool.query(
          'SELECT id FROM users WHERE line_user_id = ?',
          [lineUserId]
        );
        realUserId = existing.id;
      }

      // 2. 插入或更新 craftsmen
      await pool.query(
        `INSERT INTO craftsmen (user_id, service_areas, skills, average_rating, total_reviews, is_verified)
         VALUES (?, ?, ?, 0, 0, FALSE)
         ON DUPLICATE KEY UPDATE service_areas = VALUES(service_areas), skills = VALUES(skills)`,
        [realUserId, JSON.stringify(serviceAreas), JSON.stringify(skillIds)]
      );

      successCount++;
      if (successCount % 5 === 0) {
        console.log(`✅ 已匯入 ${successCount}/${rows.length} 位師傅...`);
      }
    } catch (err) {
      console.error(`❌ 匯入 ${name} 失敗:`, err.message);
      failures.push({ name, reason: err.message });
      failureCount++;
    }
  }

  console.log('');
  console.log(`✅ 成功匯入 ${successCount} 位師傅`);
  console.log(`⚠️ 跳過 ${skipCount} 位`);
  console.log(`❌ 失敗 ${failureCount} 位`);

  if (failures.length > 0) {
    console.log('\n失敗明細:');
    failures.forEach(f => console.log(`  - ${f.name}: ${f.reason}`));
  }

  await pool.end();
  process.exit(failureCount > 0 ? 1 : 0);
}

main();
