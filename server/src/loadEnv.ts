import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

import { LOCALHOST_CONFIG } from '@shared/constants';

function runningInDockerLinuxContainer(): boolean {
	try {
		return fs.existsSync('/.dockerenv');
	} catch {
		return false;
	}
}

function resolveComposeServiceHostToLocal(
	envVarName: 'DATABASE_HOST' | 'REDIS_HOST',
	composeServiceHostname: string,
	localHost: string
): void {
	if (process.env[envVarName] !== composeServiceHostname) {
		return;
	}
	if (runningInDockerLinuxContainer()) {
		return;
	}
	process.env[envVarName] = localHost;
}

function findMonorepoRoot(): string {
	let dir = process.cwd();
	while (true) {
		if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
			return dir;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			break;
		}
		dir = parent;
	}
	return process.cwd();
}

const monorepoRoot = findMonorepoRoot();
const envPath = path.join(monorepoRoot, '.env');
// `override: false` — Docker-injected env stays authoritative.
if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath, override: false });
}

resolveComposeServiceHostToLocal('DATABASE_HOST', 'postgres', LOCALHOST_CONFIG.hosts.DATABASE);
resolveComposeServiceHostToLocal('REDIS_HOST', 'redis', LOCALHOST_CONFIG.hosts.REDIS);
