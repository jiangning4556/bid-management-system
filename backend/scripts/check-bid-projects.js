const mysql = require('mysql2/promise');

async function checkBidProjects() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    // 检查最新创建的中标项目
    const [projects] = await conn.execute(
      'SELECT id, name, consultProjectId, totalAmount, createdAt FROM bid_projects WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT 5'
    );

    console.log('中标项目列表:');
    if (projects.length === 0) {
      console.log('  (空)');
    } else {
      projects.forEach((p, i) => {
        const date = new Date(p.createdAt);
        const isRecent = date.getTime() > Date.now() - 5 * 60 * 1000;
        console.log(`  ${i + 1}. ${p.name} - 金额: ${p.totalAmount}, 来源: ${p.consultProjectId || '直接创建'}, 时间: ${p.createdAt}${isRecent ? ' [新]' : ''}`);
      });
    }

    // 检查办公用品招标的状态
    const consultId = 'af0dcc36-98b2-4256-a72f-349d6543f7a0';
    const [related] = await conn.execute(
      'SELECT id, name, totalAmount FROM bid_projects WHERE consultProjectId = ? AND deletedAt IS NULL', [consultId]
    );

    console.log(`\n办公用品招标 (id: ${consultId}):`);
    if (related.length > 0) {
      console.log(`  ✅ 已创建中标项目:`);
      related.forEach(r => console.log(`     - ${r.name} (金额: ${r.totalAmount})`));
    } else {
      console.log(`  ❌ 没有创建中标项目`);
    }

  } finally {
    await conn.end();
  }
}

checkBidProjects().catch(console.error);
