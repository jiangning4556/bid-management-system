const mysql = require('mysql2/promise');

async function testConsultProjectIdFilter() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    console.log('=== 测试 consultProjectId 过滤逻辑 ===\n');

    // 测试 1: 查询所有中标项目
    console.log('1. 查询所有中标项目:');
    const [allBidProjects] = await conn.execute(
      'SELECT id, name, consultProjectId FROM bid_projects WHERE deletedAt IS NULL'
    );
    console.log(`   找到 ${allBidProjects.length} 个中标项目`);
    allBidProjects.forEach(bp => {
      console.log(`   - ${bp.name} (consultProjectId: ${bp.consultProjectId})`);
    });

    // 测试 2: 使用 consultProjectId 过滤
    const consultId = 'd7001b6a-9150-471a-957f-47ccbde20c20';
    console.log(`\n2. 查询 consultProjectId = ${consultId} 的中标项目:`);
    const [filteredProjects] = await conn.execute(
      'SELECT id, name, consultProjectId FROM bid_projects WHERE consultProjectId = ? AND deletedAt IS NULL', [consultId]
    );
    console.log(`   找到 ${filteredProjects.length} 个中标项目`);
    filteredProjects.forEach(bp => {
      console.log(`   - ${bp.name} (id: ${bp.id})`);
    });

    // 测试 3: 查询不存在的 consultProjectId
    const fakeId = '00000000-0000-0000-0000-000000000000';
    console.log(`\n3. 查询不存在的 consultProjectId (${fakeId}):`);
    const [noResults] = await conn.execute(
      'SELECT id, name FROM bid_projects WHERE consultProjectId = ? AND deletedAt IS NULL', [fakeId]
    );
    console.log(`   找到 ${noResults.length} 个中标项目 (预期: 0)`);

    // 测试 4: 模拟前端检查逻辑
    console.log('\n=== 模拟前端检查逻辑 ===');

    for (const cp of [
      { id: 'd7001b6a-9150-471a-957f-47ccbde20c20', name: '餐厅装修' },
      { id: 'af0dcc36-98b2-4256-a72f-349d6543f7a0', name: '办公用品招标' }
    ]) {
      const [results] = await conn.execute(
        'SELECT id, name FROM bid_projects WHERE consultProjectId = ? AND deletedAt IS NULL', [cp.id]
      );

      if (results.length > 0) {
        console.log(`✅ ${cp.name} - 已中标 (关联项目: ${results[0].name})`);
      } else {
        console.log(`⚠️  ${cp.name} - 未中标 (可转换)`);
      }
    }

  } finally {
    await conn.end();
  }
}

testConsultProjectIdFilter().catch(console.error);
