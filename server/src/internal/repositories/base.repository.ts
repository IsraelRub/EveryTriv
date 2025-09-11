import { Injectable } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOneOptions, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { serverLogger as logger } from '@shared';
/**
 * Base repository class providing common database operations
 * Manages all database requests with logging and error handling
 * @template T - The entity type extending ObjectLiteral
 */
@Injectable()
export class BaseRepository<T extends ObjectLiteral> {
	constructor(
		private repository: Repository<T>
	) {}

	protected getEntityName(): string {
		return this.repository.metadata.name;
	}

	/**
	 * Create a new entity in the database
	 * @param data Entity data to create
	 * @returns Promise<T> Created entity
	 * @throws Error - When entity creation fails
	 */
	async create(data: DeepPartial<T>): Promise<T> {
		try {
			const entityName = this.getEntityName();
			logger.databaseCreate(entityName, { context: 'REPOSITORY' });

			const entity = this.repository.create(data);
			const savedEntity = await this.repository.save(entity);

			logger.databaseInfo(`Entity created: ${entityName}`, {
				context: 'REPOSITORY',
				entityId: (savedEntity as T & { id: string | number }).id,
			});

			return savedEntity;
		} catch (error) {
			logger.databaseError(`Failed to create entity: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Find an entity by its unique identifier
	 * @param id Entity identifier (string or number)
	 * @returns Promise<T | null> Found entity or null
	 * @throws Error - When database query fails
	 */
	async findById(id: string | number): Promise<T | null> {
		try {
			const entityName = this.getEntityName();
			logger.databaseDebug(`Finding entity by ID: ${entityName}`, {
				context: 'REPOSITORY',
				entityId: id.toString(),
			});

			const entity = await this.repository.findOne({
				where: { id } as unknown as FindOptionsWhere<T>,
			} as FindOneOptions<T>);

			if (entity) {
				logger.databaseInfo(`Entity found: ${entityName}`, {
					context: 'REPOSITORY',
					found: true,
					entityId: id.toString(),
				});
			} else {
				logger.databaseInfo(`Entity not found: ${entityName}`, {
					context: 'REPOSITORY',
					found: false,
					entityId: id.toString(),
				});
			}

			return entity;
		} catch (error) {
			logger.databaseError(`Failed to find entity: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				entityId: id.toString(),
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Find entities by specified criteria
	 * @param options TypeORM find options
	 * @returns Promise<T[]> Array of found entities
	 * @throws Error - When database query fails
	 */
	async findBy(options: FindManyOptions<T>): Promise<T[]> {
		try {
			const entityName = this.getEntityName();
			logger.databaseDebug(`Finding entities: ${entityName}`, { context: 'REPOSITORY' });

			const entities = await this.repository.find(options);

			logger.databaseInfo(`Found ${entities.length} entities: ${entityName}`, {
				context: 'REPOSITORY',
				count: entities.length,
			});

			return entities;
		} catch (error) {
			logger.databaseError(`Failed to find entities: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Find all entities
	 * @returns Promise<T[]> Array of all entities
	 * @throws Error - When database query fails
	 */
	async findAll(): Promise<T[]> {
		try {
			const entityName = this.getEntityName();
			logger.databaseDebug(`Finding all entities: ${entityName}`, { context: 'REPOSITORY' });

			const entities = await this.repository.find();

			logger.databaseInfo(`Found ${entities.length} entities: ${entityName}`, {
				context: 'REPOSITORY',
				count: entities.length,
			});

			return entities;
		} catch (error) {
			logger.databaseError(`Failed to find all entities: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Update an entity in the database
	 * @param id Entity identifier
	 * @param data Entity data to update
	 * @returns Promise<T> Updated entity
	 * @throws Error - When entity update fails
	 */
	async update(id: string | number, data: DeepPartial<T>): Promise<T> {
		try {
			const entityName = this.getEntityName();
			logger.databaseDebug(`Updating entity: ${entityName}`, { context: 'REPOSITORY', entityId: id.toString() });

			await this.repository.update(id, data as never);
			const updatedEntity = await this.findById(id);

			if (!updatedEntity) {
				throw new Error('Entity not found after update');
			}

			logger.databaseInfo(`Entity updated: ${entityName}`, {
				context: 'REPOSITORY',
				entityId: id.toString(),
			});

			return updatedEntity;
		} catch (error) {
			logger.databaseError(`Failed to update entity: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				entityId: id.toString(),
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Delete an entity from the database
	 * @param id Entity identifier
	 * @returns Promise<boolean> True if deletion was successful
	 * @throws Error - When entity deletion fails
	 */
	async delete(id: string | number): Promise<boolean> {
		try {
			const entityName = this.getEntityName();
			logger.databaseDebug(`Deleting entity: ${entityName}`, { context: 'REPOSITORY', entityId: id.toString() });

			const result = await this.repository.delete(id);

			logger.databaseInfo(`Entity deleted: ${entityName}`, {
				context: 'REPOSITORY',
				entityId: id.toString(),
				affected: result.affected || 0,
			});

			return (result.affected || 0) > 0;
		} catch (error) {
			logger.databaseError(`Failed to delete entity: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				entityId: id.toString(),
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Check if an entity exists
	 * @param id Entity identifier
	 * @returns Promise<boolean> True if entity exists
	 * @throws Error - When database query fails
	 */
	async exists(id: string | number): Promise<boolean> {
		try {
			const entity = await this.findById(id);
			return entity !== null;
		} catch (error) {
			logger.databaseError(`Failed to check entity existence: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				entityId: id.toString(),
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Count entities
	 * @param options TypeORM find options
	 * @returns Promise<number> Number of entities
	 * @throws Error - When database query fails
	 */
	async count(options?: FindManyOptions<T>): Promise<number> {
		try {
			const entityName = this.getEntityName();
			logger.databaseDebug(`Counting entities: ${entityName}`, { context: 'REPOSITORY' });

			const count = await this.repository.count(options);

			logger.databaseInfo(`Counted ${count} entities: ${entityName}`, {
				context: 'REPOSITORY',
				count,
			});

			return count;
		} catch (error) {
			logger.databaseError(`Failed to count entities: ${this.repository.metadata.name}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
