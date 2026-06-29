const fs = require('fs'); const content = fs.readFileSync('services/userService.js', 'utf8'); console.log(content.match(/getDoctorProfile/g));
