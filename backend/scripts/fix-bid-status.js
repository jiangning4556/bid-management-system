const mysql = require('mysql2/promise');

async function fixBidStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management',
  });

  try {
    console.log('开始处理...\n');

    // 1. 查找名为"办公用品"的中标项目
    const [bidProjects] = await connection.query(
      `SELECT id, name, consultProjectId FROM bid_projects WHERE name LIKE '%办公用品%'`
    );

    if (bidProjects.length === 0) {
      console.log('未找到名为"办公用品"的中标项目');
      return;
    }

    console.log(`找到 ${bidProjects.length} 个名为"办公用品"的中标项目:`);
    for (const bp of bidProjects) {
      console.log(`  - ID: ${bp.id}, 咨询项目ID: ${bp.consultProjectId}`);
    }

    // 2. 处理每个中标项目
    for (const bp of bidProjects) {
      console.log(`\n处理中标项目 ${bp.id}...`);

      if (bp.consultProjectId) {
        // 清除咨询项目的中标标记
        await connection.query(
          `UPDATE consult_projects SET hasBidProject = 0, bidProjectId = NULL WHERE id = ?`,
          [bp.consultProjectId]
        );
        console.log(`  ✓ 已清除咨询项目 ${bp.consultProjectId} 的中标标记`);
      } else {
        console.log(`  ⚠ 该中标项目没有关联的咨询项目`);
      }

      // 软删除中标项目
      await connection.query(
        `UPDATE bid_projects SET deletedAt = NOW() WHERE id = ?`,
        [bp.id]
      );
      console.log(`  ✓ 已软删除中标项目 ${bp.id}`);
    }

    console.log('\n处理完成！');

    // 3. 验证结果
    console.log('\n验证结果:');
    const [verify] = await connection.query(
      `SELECT name, hasBidProject, bidProjectId FROM consult_projects WHERE name LIKE '%办公用品%'`
    );
    for (const cp of verify) {
      console.log(`  - ${cp.name}: hasBidProject = ${cp.hasBidProject}, bidProjectId = ${cp.bidProjectId}`);
    }

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await connection.end();
  }
}

fixBidStatus();
