/**
 * 数据迁移脚本：初始化咨询项目的中标状态
 *
 * 功能：
 * 1. 添加 hasBidProject 和 bidProjectId 字段到 consult_projects 表
 * 2. 根据 bid_projects 表的数据初始化这两个字段
 */

const mysql = require('mysql2/promise');

async function migrateBidStatus() {
  let connection;

  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'jn456521',
      database: 'bid_management',
      multipleStatements: true,
    });

    console.log('开始迁移中标状态数据...\n');

    // 1. 检查字段是否已存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'bid_management'
      AND TABLE_NAME = 'consult_projects'
      AND COLUMN_NAME IN ('hasBidProject', 'bidProjectId')
    `);

    const hasHasBidProject = columns.some(col => col.COLUMN_NAME === 'hasBidProject');
    const hasBidProjectId = columns.some(col => col.COLUMN_NAME === 'bidProjectId');

    // 2. 添加字段（如果不存在）
    if (!hasHasBidProject) {
      await connection.query(`
        ALTER TABLE consult_projects
        ADD COLUMN hasBidProject TINYINT(1) DEFAULT 0 COMMENT '是否已转为中标项目'
      `);
      await connection.query(`
        ALTER TABLE consult_projects
        ADD INDEX idx_hasBidProject (hasBidProject)
      `);
      console.log('✓ 添加字段 hasBidProject');
    } else {
      console.log('- 字段 hasBidProject 已存在');
    }

    if (!hasBidProjectId) {
      await connection.query(`
        ALTER TABLE consult_projects
        ADD COLUMN bidProjectId CHAR(36) NULL COMMENT '关联的中标项目ID'
      `);
      await connection.query(`
        ALTER TABLE consult_projects
        ADD INDEX idx_bidProjectId (bidProjectId)
      `);
      console.log('✓ 添加字段 bidProjectId');
    } else {
      console.log('- 字段 bidProjectId 已存在');
    }

    // 3. 初始化旧数据：根据 bid_projects 表更新 consult_projects
    console.log('\n初始化旧数据...');

    const [result] = await connection.query(`
      UPDATE consult_projects cp
      LEFT JOIN bid_projects bp ON cp.id = bp.consultProjectId AND bp.deletedAt IS NULL
      SET
        cp.hasBidProject = CASE WHEN bp.id IS NOT NULL THEN 1 ELSE 0 END,
        cp.bidProjectId = bp.id
      WHERE cp.deletedAt IS NULL
    `);

    console.log(`✓ 更新了 ${result.affectedRows} 条咨询项目记录`);

    // 4. 验证结果
    const [stats] = await connection.query(`
      SELECT
        COUNT(*) as total,
        SUM(hasBidProject) as bid_count
      FROM consult_projects
      WHERE deletedAt IS NULL
    `);

    console.log('\n迁移完成！统计信息：');
    console.log(`- 总咨询项目数：${stats[0].total}`);
    console.log(`- 已中标项目数：${stats[0].bid_count || 0}`);
    console.log(`- 未中标项目数：${stats[0].total - (stats[0].bid_count || 0)}`);

  } catch (error) {
    console.error('迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateBidStatus();
