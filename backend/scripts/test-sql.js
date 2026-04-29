const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    const itemId1 = 'c51c6997-4759-4d81-909f-4bdb00aa609f';
    const itemId2 = '94667773-49fa-4472-90c3-a14f1aa4999f';

    // 使用与后端相同的 SQL 查询
    const [quotes1] = await connection.execute(`
      SELECT q.id, q.price, q.totalAmount, q.createdAt,
             s.name as supplierName
      FROM supplier_quotes q
      LEFT JOIN suppliers s ON q.supplierId = s.id
      LEFT JOIN consult_project_items cpi ON q.projectItemId = cpi.id
      LEFT JOIN consult_projects project ON cpi.projectId = project.id
      WHERE cpi.itemId = ?
        AND project.deletedAt IS NULL
      ORDER BY q.createdAt ASC
    `, [itemId1]);
    console.log('=== itemId1 的报价 ===');
    console.log(JSON.stringify(quotes1, null, 2));

    const [quotes2] = await connection.execute(`
      SELECT q.id, q.price, q.totalAmount, q.createdAt,
             s.name as supplierName
      FROM supplier_quotes q
      LEFT JOIN suppliers s ON q.supplierId = s.id
      LEFT JOIN consult_project_items cpi ON q.projectItemId = cpi.id
      LEFT JOIN consult_projects project ON cpi.projectId = project.id
      WHERE cpi.itemId = ?
        AND project.deletedAt IS NULL
      ORDER BY q.createdAt ASC
    `, [itemId2]);
    console.log('\n=== itemId2 的报价 ===');
    console.log(JSON.stringify(quotes2, null, 2));

  } finally {
    await connection.end();
  }
}

test();
