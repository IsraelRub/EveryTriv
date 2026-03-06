import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserStatsMaintenanceService } from '../src/features/maintenance';

async function run() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const maintenance = app.get(UserStatsMaintenanceService);
	const result = await maintenance.checkAllUsersConsistency();
	console.log('Consistency check result:', JSON.stringify(result, null, 2));
	if (result.inconsistentUsers > 0) {
		console.log(
			'\nInconsistent user IDs:',
			result.results.filter((r) => !r.isConsistent).map((r) => r.userId),
		);
	}
	await app.close();
	process.exit(0);
}

run().catch((err) => {
	console.error('Check failed:', err);
	process.exit(1);
});
