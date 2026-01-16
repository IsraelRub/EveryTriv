import type { HealthStatus } from '@internal/constants';

export interface HealthCheck {
	status: HealthStatus;
	message?: string;
	responseTime?: number;
}

export interface HealthCheckResponse {
	status: HealthStatus;
	timestamp: string;
	uptime: number;
	checks: {
		database: HealthCheck;
		system: HealthCheck;
	};
}

export interface LivenessCheckResponse {
	status: 'alive';
	timestamp: string;
}

export interface ReadinessCheckResponse {
	status: 'ready' | 'not ready';
	timestamp: string;
	database: HealthStatus;
}
