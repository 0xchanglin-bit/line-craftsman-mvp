require('dotenv').config();
const mysql = require('mysql2/promise');
const SERVICE_SKILLS = require('../src/config/service_skills');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  console.log('🌱 開始初始化服務項目...');

  try {
    for (const service of SERVICE_SKILLS) {
      await pool.query(
        `INSERT INTO service_skills (id, name, category, description, is_active)
         VALUES (?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE is_active = TRUE`,
        [service.id, service.name, service.category, service.description]
      );
      console.log(`✅ 已加入: ${service.name}`);
    }
    console.log(`✅ 成功初始化 ${SERVICE_SKILLS.length} 項服務`);
  } catch (error) {
    console.error('❌ 初始化失敗:', error.message);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
  process.exit(0);
}

main();
