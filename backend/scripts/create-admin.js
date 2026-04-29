const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'jn456521',
      database: 'bid_management',
    });

    // Check if admin exists
    const [rows] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);

    if (rows.length > 0) {
      console.log('管理员账号已存在');
      console.log('用户名: admin');
      console.log('密码: admin123');
      await connection.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    const id = require('uuid').v4();
    await connection.query(
      'INSERT INTO users (id, username, password, email, phone, role, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, 'admin', hashedPassword, 'admin@example.com', '13800138000', 'admin', 1]
    );

    console.log('管理员账号创建成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');

    await connection.end();
  } catch (error) {
    console.error('创建管理员账号失败:', error.message);
    process.exit(1);
  }
}

createAdmin();
