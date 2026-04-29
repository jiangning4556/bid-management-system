const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jn456521',
    database: 'bid_management'
  });

  try {
    console.log('Starting supplier displayId migration...');

    // Check if displayId column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'bid_management' AND TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'displayId'
    `);

    if (columns.length === 0) {
      console.log('Adding displayId column...');
      await connection.execute(`
        ALTER TABLE suppliers ADD COLUMN displayId INT UNIQUE AFTER id
      `);
      console.log('displayId column added.');
    } else {
      console.log('displayId column already exists.');
    }

    // Get all suppliers ordered by createdAt
    const [suppliers] = await connection.execute(`
      SELECT id FROM suppliers WHERE deletedAt IS NULL ORDER BY createdAt
    `);

    console.log(`Found ${suppliers.length} suppliers to update.`);

    // Update each supplier with sequential displayId
    for (let i = 0; i < suppliers.length; i++) {
      const displayId = i + 1;
      await connection.execute(`
        UPDATE suppliers SET displayId = ? WHERE id = ?
      `, [displayId, suppliers[i].id]);
    }

    console.log('Migration completed successfully!');
    console.log(`Updated ${suppliers.length} suppliers with displayId values.`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
