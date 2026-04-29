const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'jn456521', database: 'bid_management'
  });

  // 查看所有中标项目的合同金额和项目金额
  const [projects] = await conn.query(`
    SELECT id, name, contractAmount, totalAmount, deletedAt
    FROM bid_projects
    WHERE deletedAt IS NULL
  `);

  console.log('中标项目列表:');
  console.table(projects);

  // 计算合同金额总和（优先使用contractAmount）
  let totalContractAmount = 0;
  let totalAmount = 0;
  for (const p of projects) {
    const amount = p.contractAmount || p.totalAmount || 0;
    totalContractAmount += parseFloat(amount);
    totalAmount += parseFloat(p.totalAmount || 0);
  }

  console.log('\n统计:');
  console.log('项目金额总和 (totalAmount):', totalAmount);
  console.log('合同金额总和 (COALESCE contractAmount):', totalContractAmount);

  // 查看收付款记录
  const [receipts] = await conn.query(`
    SELECT SUM(amount) as total
    FROM receipt_records
  `);
  console.log('已收金额:', receipts[0].total);

  await conn.end();
})();
