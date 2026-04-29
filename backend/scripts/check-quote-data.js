const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    // 检查 supplier_quotes 表结构
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'bid_management'
      AND TABLE_NAME = 'supplier_quotes'
    `);
    console.log('=== supplier_quotes 表结构 ===');
    console.log(columns);

    // 检查 consult_project_items 表结构
    const [itemColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'bid_management'
      AND TABLE_NAME = 'consult_project_items'
    `);
    console.log('\n=== consult_project_items 表结构 ===');
    console.log(itemColumns);

    // 检查数据
    const [quotes] = await connection.execute(`
      SELECT id, projectItemId, supplierId, price
      FROM supplier_quotes
      LIMIT 5
    `);
    console.log('\n=== supplier_quotes 数据 ===');
    console.log(quotes);

    const [items] = await connection.execute(`
      SELECT id, itemId, projectId
      FROM consult_project_items
      LIMIT 5
    `);
    console.log('\n=== consult_project_items 数据 ===');
    console.log(items);

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await connection.end();
  }
}

check();
