import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';

const NEW_PASSWORD = 'AdminPass123!';
const ADMIN_EMAIL = 'admin@example.com';

async function run() {
	console.log(`Resetting password for ${ADMIN_EMAIL}...`);

	const app = await NestFactory.createApplicationContext(AppModule, {
		logger: false,
	});

	const dataSource = app.get(DataSource);

	const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
	const hashedPassword = await hash(NEW_PASSWORD, bcryptRounds);

	const result = await dataSource.query(
		`UPDATE "users" SET "password_hash" = $1 WHERE "email" = $2 RETURNING "id", "email", "role"`,
		[hashedPassword, ADMIN_EMAIL]
	);

	if (result.length === 0) {
		console.error(`User with email ${ADMIN_EMAIL} not found.`);
	} else {
		console.log(`Password reset successfully for user:`, {
			id: result[0].id,
			email: result[0].email,
			role: result[0].role,
		});
		console.log(`New password: ${NEW_PASSWORD}`);
	}

	await app.close();
	process.exit(0);
}

run().catch((err) => {
	console.error('Password reset failed:', err);
	process.exit(1);
});
