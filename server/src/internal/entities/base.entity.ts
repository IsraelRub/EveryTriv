import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import type { BaseEntity as BaseEntityContract } from '@shared/types';

export abstract class BaseEntity implements BaseEntityContract {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date;
}
