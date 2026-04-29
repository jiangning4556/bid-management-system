const mysql = require('mysql2/promise');

async function checkSuppliers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    // 查询所有供应商
    const [suppliers] = await connection.execute(`
      SELECT id, name, userId, deletedAt
      FROM suppliers
      LIMIT 10
    `);
    console.log('=== 供应商数据 ===');
    console.log(suppliers);

    // 查询用户信息
    const [users] = await connection.execute(`
      SELECT id, username, role
      FROM users
    `);
    console.log('\n=== 用户数据 ===');
    console.log(users);

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkSuppliers();
