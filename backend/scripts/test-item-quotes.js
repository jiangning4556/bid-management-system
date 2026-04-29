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

    // 查询 itemId1 的 projectItems
    const [pi1] = await connection.execute(`
      SELECT id, itemId, projectId
      FROM consult_project_items
      WHERE itemId = ?
    `, [itemId1]);
    console.log('=== itemId1 的 projectItems ===');
    console.log(pi1);

    // 查询 itemId2 的 projectItems
    const [pi2] = await connection.execute(`
      SELECT id, itemId, projectId
      FROM consult_project_items
      WHERE itemId = ?
    `, [itemId2]);
    console.log('\n=== itemId2 的 projectItems ===');
    console.log(pi2);

    // 查询 itemId1 的报价
    if (pi1.length > 0) {
      const ids1 = pi1.map(p => p.id);
      const [quotes1] = await connection.execute(`
        SELECT q.id, q.price, q.supplierId, q.projectItemId
        FROM supplier_quotes q
        WHERE q.projectItemId IN (?${',?'.repeat(ids1.length - 1)})
      `, ids1);
      console.log('\n=== itemId1 的报价 ===');
      console.log(quotes1);
    }

    // 查询 itemId2 的报价
    if (pi2.length > 0) {
      const ids2 = pi2.map(p => p.id);
      const [quotes2] = await connection.execute(`
        SELECT q.id, q.price, q.supplierId, q.projectItemId
        FROM supplier_quotes q
        WHERE q.projectItemId IN (?${',?'.repeat(ids2.length - 1)})
      `, ids2);
      console.log('\n=== itemId2 的报价 ===');
      console.log(quotes2);
    }

  } finally {
    await connection.end();
  }
}

test();
