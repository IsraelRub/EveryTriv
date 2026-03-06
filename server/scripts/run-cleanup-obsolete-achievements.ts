import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataMaintenanceService } from '../src/features/maintenance';

async function run() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const dataMaintenance = app.get(DataMaintenanceService);
	const result = await dataMaintenance.cleanupObsoleteAchievements();
	console.log('Cleanup obsolete achievements result:', JSON.stringify(result, null, 2));
	await app.close();
	process.exit(0);
}

run().catch((err) => {
	console.error('Cleanup failed:', err);
	process.exit(1);
});
