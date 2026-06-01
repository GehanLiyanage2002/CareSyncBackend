const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'caresync',
  password: 'Liyanage@123',
  port: 5432,
});

client.connect()
  .then(() => client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'appointments';
  `))
  .then(res => {
    console.log(res.rows);
    return client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
