
const fs = require('fs');
const { createConnection } = require('net');
const path = require('path');

function findMonorepoRoot() {
	let dir = process.cwd();
	for (;;) {
		if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return process.cwd();
}

function parseEnvFile(filePath) {
	const out = {};
	if (!fs.existsSync(filePath)) return out;
	const text = fs.readFileSync(filePath, 'utf8');
	for (const line of text.split(/\r?\n/)) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const eq = t.indexOf('=');
		if (eq === -1) continue;
		const key = t.slice(0, eq).trim();
		let val = t.slice(eq + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		out[key] = val;
	}
	return out;
}

function checkPort(host, port, label, timeoutMs = 2500) {
	return new Promise(resolve => {
		const socket = createConnection({ host, port }, () => {
			socket.end();
			resolve({ ok: true, label, host, port });
		});
		socket.setTimeout(timeoutMs);
		socket.on('error', () => {
			socket.destroy();
			resolve({ ok: false, label, host, port });
		});
		socket.on('timeout', () => {
			socket.destroy();
			resolve({ ok: false, label, host, port });
		});
	});
}

async function main() {
	const root = findMonorepoRoot();
	const envPath = path.join(root, '.env');
	const devPath = path.join(root, '.env.dev');
	const env = { ...parseEnvFile(envPath), ...parseEnvFile(devPath) };

	const dbHost = env.DATABASE_HOST || 'localhost';
	const dbPort = parseInt(env.DATABASE_PORT || '5432', 10);
	const redisHost = env.REDIS_HOST || 'localhost';
	const redisPort = parseInt(env.REDIS_PORT || '6380', 10);

	console.log('EveryTriv — local service check (merged `.env` + `.env.dev` from ' + root + ')');
	console.log('');

	const results = await Promise.all([
		checkPort(dbHost, dbPort, 'PostgreSQL'),
		checkPort(redisHost, redisPort, 'Redis'),
	]);

	let failed = false;
	for (const r of results) {
		const status = r.ok ? 'OK' : 'FAIL';
		const line = `[${status}] ${r.label} ${r.host}:${r.port}`;
		console.log(line);
		if (!r.ok) failed = true;
	}

	console.log('');
	if (failed) {
		console.log('Fix services or .env / .env.dev, then retry. See docs/LOCAL_DEV_NO_DOCKER.md');
		process.exit(1);
	}
	console.log('Ready for: pnpm run start:dev');
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
