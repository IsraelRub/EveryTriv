import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserStatsMaintenanceService } from '../src/features/maintenance';

async function run() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const maintenance = app.get(UserStatsMaintenanceService);
	const result = await maintenance.fixAllInconsistentUsers();
	console.log('Maintenance fix-all result:', result);
	await app.close();
	process.exit(0);
}

run().catch((err) => {
	console.error('Maintenance failed:', err);
	process.exit(1);
});
