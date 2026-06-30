const AuthService = require('./services/AuthService');

async function test() {
  try {
    const res = await AuthService.loginUser('kasun.bandara@test.com', 'password123');
    console.log(res);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
