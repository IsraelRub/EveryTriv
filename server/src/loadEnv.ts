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

function resolveUseProdOverlay(): boolean {
	const explicit = process.env.DOTENV_PROFILE?.trim().toLowerCase();
	if (explicit === 'prod') {
		return true;
	}
	if (explicit === 'dev') {
		return false;
	}
	return (process.env.NODE_ENV ?? '').trim().toLowerCase() === 'prod';
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
const envDevPath = path.join(monorepoRoot, '.env.dev');
const envProdPath = path.join(monorepoRoot, '.env.prod');

// Shared secrets / flags — Docker-injected env stays authoritative where override is false.
if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath, override: false });
}

const inDocker = runningInDockerLinuxContainer();
if (inDocker) {
	if (fs.existsSync(envProdPath)) {
		dotenv.config({ path: envProdPath, override: false });
	}
} else {
	const overlayPath = resolveUseProdOverlay() ? envProdPath : envDevPath;
	if (fs.existsSync(overlayPath)) {
		dotenv.config({ path: overlayPath, override: true });
	}
}

resolveComposeServiceHostToLocal('DATABASE_HOST', 'postgres', LOCALHOST_CONFIG.hosts.DATABASE);
resolveComposeServiceHostToLocal('REDIS_HOST', 'redis', LOCALHOST_CONFIG.hosts.REDIS);
