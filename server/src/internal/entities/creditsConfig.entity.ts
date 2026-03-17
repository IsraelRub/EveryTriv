import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from './base.entity';

@Entity('credits_config')
export class CreditsConfigEntity extends BaseEntity {
	@Column({ type: 'varchar', length: 128 })
	@Index({ unique: true })
	key!: string;

	@Column({ type: 'jsonb', default: () => "'null'::jsonb" })
	value!: unknown;
}
