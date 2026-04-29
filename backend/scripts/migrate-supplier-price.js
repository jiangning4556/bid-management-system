/**
 * Migration script to add 'price' column to bid_suppliers table
 * and calculate price from amount / quantity
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'bid_management',
  });

  try {
    console.log('开始迁移 bid_suppliers 表...');

    // 1. 检查 price 列是否已存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'bid_suppliers' AND COLUMN_NAME = 'price'
    `);

    if (columns.length > 0) {
      console.log('price 列已存在，跳过添加列操作');
    } else {
      // 2. 添加 price 列
      await connection.execute(`
        ALTER TABLE bid_suppliers
        ADD COLUMN price DECIMAL(15, 2) NULL COMMENT '单价'
        AFTER supplierId
      `);
      console.log('已添加 price 列');
    }

    // 3. 获取所有供应商记录及其对应的物品数量
    const [suppliers] = await connection.execute(`
      SELECT bs.id, bs.amount, bs.price, bpi.quantity
      FROM bid_suppliers bs
      JOIN bid_project_items bpi ON bs.projectItemId = bpi.id
    `);

    console.log(`找到 ${suppliers.length} 条供应商记录需要更新`);

    // 4. 计算并更新 price (price = amount / quantity)
    let updatedCount = 0;
    for (const supplier of suppliers) {
      // 如果 price 为空或为 0，则计算
      if (!supplier.price || supplier.price === 0) {
        const quantity = supplier.quantity || 1;
        const price = quantity > 0 ? supplier.amount / quantity : supplier.amount;

        await connection.execute(`
          UPDATE bid_suppliers SET price = ? WHERE id = ?
        `, [price, supplier.id]);
        updatedCount++;
      }
    }

    console.log(`已更新 ${updatedCount} 条记录的 price 值`);

    // 5. 将 price 列设为 NOT NULL（在更新完所有数据后）
    await connection.execute(`
      ALTER TABLE bid_suppliers
      MODIFY COLUMN price DECIMAL(15, 2) NOT NULL COMMENT '单价'
    `);
    console.log('已将 price 列设为 NOT NULL');

    console.log('迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
