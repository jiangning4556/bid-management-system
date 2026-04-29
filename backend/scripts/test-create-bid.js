// 模拟后端创建中标项目的逻辑
const mysql = require('mysql2/promise');

async function testCreateBidLogic() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    const consultProjectId = 'af0dcc36-98b2-4256-a72f-349d6543f7a0';
    const userId = '6bb032cd-9b63-4609-aa78-ad1ea69121f5';

    console.log('=== 模拟创建中标项目 ===\n');

    // 1. 查询咨询项目
    console.log('1. 查询咨询项目...');
    const [consultProjects] = await conn.execute(
      'SELECT id, name, projectCode, customer, address FROM consult_projects WHERE id = ? AND deletedAt IS NULL',
      [consultProjectId]
    );

    if (consultProjects.length === 0) {
      console.log('❌ 咨询项目不存在');
      return;
    }

    const consultProject = consultProjects[0];
    console.log(`✅ 找到咨询项目: ${consultProject.name}`);

    // 2. 查询项目项和报价
    console.log('\n2. 查询项目项和报价...');
    const [items] = await conn.execute(
      'SELECT id, itemId, quantity, remarks FROM consult_project_items WHERE projectId = ?',
      [consultProjectId]
    );

    console.log(`   项目项数量: ${items.length}`);

    let totalAmount = 0;
    let validItems = 0;

    for (const item of items) {
      const [quotes] = await conn.execute(
        'SELECT id, supplierId, totalAmount, isSelected FROM supplier_quotes WHERE projectItemId = ?',
        [item.id]
      );

      const selectedQuotes = quotes.filter(q => q.isSelected === 1);

      if (selectedQuotes.length > 0) {
        validItems++;
        console.log(`   ✅ 项目项 ${item.id}: ${selectedQuotes.length} 个选中报价`);
        selectedQuotes.forEach(q => {
          const amount = parseFloat(q.totalAmount);
          totalAmount += amount;
          console.log(`      供应商 ${q.supplierId}: ${q.totalAmount} (累计: ${totalAmount})`);
        });
      } else {
        console.log(`   ⚠️  项目项 ${item.id}: 没有选中报价，跳过`);
      }
    }

    console.log(`\n3. 统计信息:`);
    console.log(`   有效项目项: ${validItems}/${items.length}`);
    console.log(`   总金额: ${totalAmount}`);

    if (validItems === 0) {
      console.log('\n❌ 没有选中的报价，无法创建中标项目');
      return;
    }

    console.log('\n✅ 模拟创建成功！');

  } finally {
    await conn.end();
  }
}

testCreateBidLogic().catch(console.error);
