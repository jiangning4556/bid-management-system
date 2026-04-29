const mysql = require('mysql2/promise');

async function testCreateFromConsult() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    // 1. 检查咨询项目
    const [consultProjects] = await conn.execute(
      'SELECT id, name, userId FROM consult_projects WHERE deletedAt IS NULL LIMIT 1'
    );

    if (consultProjects.length === 0) {
      console.log('❌ 没有找到咨询项目');
      return;
    }

    const consultProject = consultProjects[0];
    console.log('✅ 找到咨询项目:', consultProject);

    // 2. 检查咨询项目的项目项
    const [items] = await conn.execute(
      'SELECT id, itemId FROM consult_project_items WHERE projectId = ?', [consultProject.id]
    );

    console.log('✅ 项目项数量:', items.length);

    let hasSelectedQuotes = false;
    for (const item of items) {
      const [quotes] = await conn.execute(
        'SELECT id, supplierId, price, isSelected FROM supplier_quotes WHERE projectItemId = ?', [item.id]
      );

      const selectedCount = quotes.filter(q => q.isSelected === 1).length;
      if (selectedCount > 0) {
        hasSelectedQuotes = true;
        console.log(`✅ 项目项 ${item.id} 有 ${selectedCount} 个选中的报价`);
      } else {
        console.log(`⚠️  项目项 ${item.id} 没有选中的报价 (共 ${quotes.length} 个报价)`);
      }
    }

    if (!hasSelectedQuotes) {
      console.log('❌ 没有选中的报价，无法转为中标项目');
      console.log('💡 请先在管理报价中选中至少一个供应商报价');
    } else {
      console.log('✅ 可以转为中标项目');
    }

    // 3. 检查中标项目
    const [bidProjects] = await conn.execute(
      'SELECT id, name, consultProjectId, createdAt FROM bid_projects WHERE consultProjectId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [consultProject.id]
    );

    console.log('✅ 该咨询项目已创建的中标项目数量:', bidProjects.length);
    if (bidProjects.length > 0) {
      console.log('   最新中标项目:', bidProjects[0]);
    }

  } finally {
    await conn.end();
  }
}

testCreateFromConsult().catch(console.error);
