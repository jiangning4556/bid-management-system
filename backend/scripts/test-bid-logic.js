const mysql = require('mysql2/promise');

async function testBidConversionLogic() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    console.log('=== 测试转为中标逻辑 ===\n');

    // 1. 获取咨询项目
    const [consultProjects] = await conn.execute(
      'SELECT id, name FROM consult_projects WHERE deletedAt IS NULL LIMIT 3'
    );

    if (consultProjects.length === 0) {
      console.log('❌ 没有咨询项目');
      return;
    }

    console.log(`1. 找到 ${consultProjects.length} 个咨询项目:`);

    for (const cp of consultProjects) {
      console.log(`\n--- 项目: ${cp.name} (${cp.id}) ---`);

      // 2. 检查项目项和报价
      const [items] = await conn.execute(
        'SELECT id FROM consult_project_items WHERE projectId = ?', [cp.id]
      );

      let totalQuotes = 0;
      let selectedQuotes = 0;
      let itemsWithSelections = 0;

      for (const item of items) {
        const [quotes] = await conn.execute(
          'SELECT isSelected FROM supplier_quotes WHERE projectItemId = ?', [item.id]
        );
        totalQuotes += quotes.length;
        const itemSelected = quotes.filter(q => q.isSelected === 1).length;
        if (itemSelected > 0) {
          itemsWithSelections++;
          selectedQuotes += itemSelected;
        }
      }

      console.log(`   项目项: ${items.length}, 报价总数: ${totalQuotes}, 已选报价: ${selectedQuotes}`);

      // 3. 检查是否已有中标项目
      const [bidProjects] = await conn.execute(
        'SELECT id, name, totalAmount FROM bid_projects WHERE consultProjectId = ? AND deletedAt IS NULL', [cp.id]
      );

      if (bidProjects.length > 0) {
        console.log(`   ✅ 已转为中标项目 (数量: ${bidProjects.length})`);
        bidProjects.forEach(bp => {
          console.log(`      - ${bp.name} (金额: ${bp.totalAmount})`);
        });
      } else {
        if (selectedQuotes > 0) {
          console.log(`   ✅ 可以转为中标项目 (${selectedQuotes} 个选中报价)`);
        } else {
          console.log(`   ⚠️  无法转为中标项目 (没有选中报价)`);
        }
      }
    }

    // 4. 统计信息
    const [stats] = await conn.execute(`
      SELECT
        COUNT(*) as totalConsultProjects,
        SUM(CASE WHEN EXISTS(
          SELECT 1 FROM bid_projects WHERE bid_projects.consultProjectId = consult_projects.id AND bid_projects.deletedAt IS NULL
        ) THEN 1 ELSE 0 END) as convertedProjects
      FROM consult_projects WHERE deletedAt IS NULL
    `);

    console.log('\n=== 统计信息 ===');
    console.log(`咨询项目总数: ${stats[0].totalConsultProjects}`);
    console.log(`已转为中标项目: ${stats[0].convertedProjects}`);
    console.log(`未转为中标项目: ${stats[0].totalConsultProjects - stats[0].convertedProjects}`);

  } finally {
    await conn.end();
  }
}

testBidConversionLogic().catch(console.error);
