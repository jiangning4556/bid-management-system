const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'jn456521',
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS bid_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('Database "bid_management" created successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error.message);
    process.exit(1);
  }
}

createDatabase();
