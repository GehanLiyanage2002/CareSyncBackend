const db = require('./config/db');

async function createTable() {
  try {
    console.log("Creating vector extension...");
    await db.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    console.log("Creating system_knowledge table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_knowledge (
        id SERIAL PRIMARY KEY,
        content TEXT,
        embedding vector(1536)
      );
    `);
    
    console.log("Vector table created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating vector table:", err);
    process.exit(1);
  }
}

createTable();
