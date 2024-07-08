import { createPool } from "mysql2/promise";

const pool = createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "Bitespeed",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function createTable() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phoneNumber VARCHAR(20),
        email VARCHAR(100),
        linkedId INT,
        linkPrecedence ENUM ('secondary', 'primary') DEFAULT 'primary',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL,
        UNIQUE (phoneNumber, email,linkPrecedence)
      )
    `);
    console.log("Table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

createTable();

export default pool;
