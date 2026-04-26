const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serverRoot = path.resolve(__dirname, '..');
const mainJs = path.join(serverRoot, 'dist', 'server', 'src', 'main.js');

if (fs.existsSync(mainJs)) {
	process.exit(0);
}

execSync('pnpm run build', { cwd: serverRoot, stdio: 'inherit', shell: true });
