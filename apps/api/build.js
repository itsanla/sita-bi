const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy dari dist/apps/api/src ke dist
if (fs.existsSync('dist/apps/api/src')) {
  copyDir('dist/apps/api/src', 'dist');
}

// Hapus folder apps dan packages
if (fs.existsSync('dist/apps')) {
  fs.rmSync('dist/apps', { recursive: true, force: true });
}
if (fs.existsSync('dist/packages')) {
  fs.rmSync('dist/packages', { recursive: true, force: true });
}

console.log('Build cleanup completed');
