const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const email = 'admin@blog.com';
  const hashed = await bcrypt.hash('admin123456', 10);
  const [res] = await conn.execute(
    "UPDATE users SET password=? WHERE email=?",
    [hashed, email],
  );
  console.log('AFFECTED', res.affectedRows);
  await conn.end();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
