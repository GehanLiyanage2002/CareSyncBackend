const adminController = require('./controllers/adminController');
const db = require('./config/db');

async function test() {
  const req = { query: {} };
  const res = {
    status: (code) => ({
      json: (data) => console.log(JSON.stringify(data, null, 2))
    })
  };
  const next = (err) => console.error(err);
  await adminController.getEarnings(req, res, next);
  process.exit(0);
}
test();
