const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  const userId = '4b53310a-9ebd-4e22-a0ee-4110ececf752';

  // Simulate the fixed query
  const rawQuery = `
    SELECT SUM(bs.amount) as total
    FROM bid_suppliers bs
    LEFT JOIN bid_project_items bpi ON bpi.id = bs.projectItemId
    LEFT JOIN bid_projects bp ON bp.id = bpi.projectId
    WHERE bs.isSelected = 1 AND bp.deletedAt IS NULL
    AND bp.userId = ?
  `;

  const [result] = await conn.query(rawQuery, [userId]);
  console.log('User-filtered totalPayable:', result[0].total || 0);

  // All users (should be 57600)
  const allQuery = `
    SELECT SUM(bs.amount) as total
    FROM bid_suppliers bs
    LEFT JOIN bid_project_items bpi ON bpi.id = bs.projectItemId
    LEFT JOIN bid_projects bp ON bp.id = bpi.projectId
    WHERE bs.isSelected = 1 AND bp.deletedAt IS NULL
  `;

  const [allResult] = await conn.query(allQuery);
  console.log('All users totalPayable:', allResult[0].total || 0);

  await conn.end();
})();
