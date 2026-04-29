const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  console.log('=== 正确的统计值（手动计算） ===');

  console.log('\n--- 应收总额 ---');
  const [receivable] = await conn.query(`
    SELECT id, name, contractAmount, totalAmount
    FROM bid_projects WHERE deletedAt IS NULL
  `);
  let totalRecv = 0;
  for (const p of receivable) {
    const amt = parseFloat(p.contractAmount || p.totalAmount || 0);
    totalRecv += amt;
    console.log(`  ${p.name}: ${amt}`);
  }
  console.log('应收总额 =', totalRecv);

  console.log('\n--- 应付总额（SELECTED供应商，过滤已删除项目） ---');
  const [payable] = await conn.query(`
    SELECT bs.amount, bp.name as projectName, bp.deletedAt
    FROM bid_suppliers bs
    JOIN bid_project_items bpi ON bs.projectItemId = bpi.id
    JOIN bid_projects bp ON bpi.projectId = bp.id
    WHERE bs.isSelected = 1
  `);
  let totalPay = 0;
  for (const p of payable) {
    if (!p.deletedAt) {
      totalPay += parseFloat(p.amount);
      console.log(`  ${p.projectName}: ${p.amount}`);
    } else {
      console.log(`  ${p.projectName} (已删除): ${p.amount} - 跳过`);
    }
  }
  console.log('应付总额 =', totalPay);

  console.log('\n--- 收款记录（过滤已删除项目） ---');
  const [receipts] = await conn.query(`
    SELECT rr.id, rr.amount, rr.projectId, bp.name as projectName, bp.deletedAt
    FROM receipt_records rr
    LEFT JOIN bid_projects bp ON rr.projectId = bp.id
  `);
  let totalRecvAmt = 0;
  for (const r of receipts) {
    if (r.deletedAt === null) {
      totalRecvAmt += parseFloat(r.amount);
      console.log(`  ${r.projectName || '无项目:' + r.projectId}: ${r.amount}`);
    } else {
      console.log(`  ${r.projectName} (已删除): ${r.amount} - 跳过`);
    }
  }
  console.log('已收总额 =', totalRecvAmt);

  console.log('\n--- 付款记录（过滤已删除项目） ---');
  const [payments] = await conn.query(`
    SELECT pr.id, pr.amount, pr.projectId, bp.name as projectName, bp.deletedAt
    FROM payment_records pr
    LEFT JOIN bid_projects bp ON pr.projectId = bp.id
  `);
  let totalPaidAmt = 0;
  for (const p of payments) {
    if (p.deletedAt === null) {
      totalPaidAmt += parseFloat(p.amount);
      console.log(`  ${p.projectName || '无项目:' + p.projectId}: ${p.amount}`);
    } else {
      console.log(`  ${p.projectName} (已删除): ${p.amount} - 跳过`);
    }
  }
  console.log('已付总额 =', totalPaidAmt);

  console.log('\n=== 总结 ===');
  console.log('应收总额:', totalRecv);
  console.log('应付总额:', totalPay);
  console.log('已收金额:', totalRecvAmt);
  console.log('未收金额:', totalRecv - totalRecvAmt);
  console.log('已付金额:', totalPaidAmt);
  console.log('未付金额:', totalPay - totalPaidAmt);

  await conn.end();
}

check().catch(console.error);
