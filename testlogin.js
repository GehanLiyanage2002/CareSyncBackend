const AuthController = require('./controllers/authController');
const User = require('./models/User');
require('dotenv').config();

(async () => {
  try {
    const user = await User.findByEmail('gahenliyanage@gmail.com');
    console.log("DECRYPTED:", !!user);
  } catch (err) {
    console.error("CAUGHT EXCEPTION:", err);
  }
  process.exit(0);
})();
