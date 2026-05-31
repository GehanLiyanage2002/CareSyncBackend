const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') search(fullPath);
    } else if (fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('cancelled')) {
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes("'cancelled'") || line.includes('"cancelled"')) {
            console.log(`FOUND in ${fullPath}:${i+1} -> ${line.trim()}`);
          }
        });
      }
    }
  }
}
search(__dirname);
