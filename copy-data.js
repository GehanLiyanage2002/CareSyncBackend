const { Client } = require('pg');

const localUrl = 'postgresql://postgres:Liyanage@123@localhost:5432/caresync?schema=public';
const cloudUrl = 'postgres://a18f15cff1babec88b28b975a902f2e82ef79479291c7e2f93e7ee62b51bf3db:sk_3L2sDKMLS4KCAeBAMONYU@pooled.db.prisma.io:5432/postgres?sslmode=require';

const tables = [
  'users',
  'medical_services',
  'services',
  'dummy_items',
  'doctor_profiles',
  'doctor_schedules',
  'appointments',
  'medical_reports',
  'service_bookings',
  'reviews'
];

async function migrate() {
  const local = new Client({ connectionString: localUrl });
  const cloud = new Client({ connectionString: cloudUrl });
  
  console.log("Connecting to databases...");
  await local.connect();
  await cloud.connect();

  for (const table of tables) {
    console.log(`Migrating table ${table}...`);
    const res = await local.query(`SELECT * FROM "${table}"`);
    const rows = res.rows;
    if (rows.length === 0) {
        console.log(` - 0 rows`);
        continue;
    }
    
    const columns = Object.keys(rows[0]);
    let successCount = 0;
    
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      const colStr = columns.map(c => `"${c}"`).join(', ');
      const valPlaceholder = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      try {
        await cloud.query(
          `INSERT INTO "${table}" (${colStr}) VALUES (${valPlaceholder}) ON CONFLICT DO NOTHING`,
          values
        );
        successCount++;
      } catch (err) {
        console.error(`Error inserting into ${table}:`, err.message);
      }
    }
    
    console.log(` - ${successCount}/${rows.length} rows migrated`);

    // Fix sequence if table uses serial ID
    const serialTables = ['medical_services', 'services', 'dummy_items', 'service_bookings'];
    if (serialTables.includes(table)) {
        try {
            await cloud.query(`SELECT setval('"${table}_id_seq"', COALESCE((SELECT MAX(id)+1 FROM "${table}"), 1), false)`);
            console.log(` - Sequence updated for ${table}`);
        } catch (err) {
            console.log(` - Sequence update skipped for ${table}:`, err.message);
        }
    }
  }
  
  await local.end();
  await cloud.end();
  console.log('Data Migration Complete!');
}

migrate().catch(console.error);
