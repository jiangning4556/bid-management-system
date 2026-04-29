const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  console.log('=== 测试 getReceivableStats SQL ===');
  const [receivable] = await conn.query(`
    SELECT SUM(COALESCE(project.contractAmount, project.totalAmount, 0)) as totalReceivable
    FROM bid_projects project
    WHERE project.deletedAt IS NULL
  `);
  console.log('应收总额:', receivable[0].totalReceivable);

  console.log('\n=== 测试 getPayableStats SQL ===');
  const [payable] = await conn.query(`
    SELECT SUM(supplier.amount) as totalPayable
    FROM bid_suppliers supplier
    JOIN bid_project_items item ON supplier.projectItemId = item.id
    JOIN bid_projects project ON item.projectId = project.id
    WHERE supplier.isSelected = 1
      AND project.deletedAt IS NULL
  `);
  console.log('应付总额:', payable[0].totalPayable);

  console.log('\n=== 测试 payment_records SQL ===');
  const [paid] = await conn.query(`
    SELECT SUM(payment.amount) as totalPaid
    FROM payment_records payment
    LEFT JOIN bid_projects project ON payment.projectId = project.id
    WHERE project.deletedAt IS NULL
  `);
  console.log('已付总额:', paid[0].totalPaid);

  console.log('\n=== 测试 receipt_records SQL ===');
  const [received] = await conn.query(`
    SELECT SUM(receipt.amount) as totalReceived
    FROM receipt_records receipt
    LEFT JOIN bid_projects project ON receipt.projectId = project.id
    WHERE project.deletedAt IS NULL
  `);
  console.log('已收总额:', received[0].totalReceived);

  await conn.end();
}

test().catch(console.error);
