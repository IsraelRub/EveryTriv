import { Repository, DeepPartial, FindOneOptions, FindManyOptions, ObjectLiteral } from 'typeorm';
import { Injectable } from '@nestjs/common';

/**
 * Base repository class that aligns with the architecture diagram's repository layer
 * "he's manage all the DB requests"
 */
@Injectable()
export class BaseRepository<T extends ObjectLiteral> {
  constructor(private repository: Repository<T>) {}

  /**
   * Create a new entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity as any);
  }

  /**
   * Find an entity by id
   */
  async findById(id: string | number): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any } as FindOneOptions<T>);
  }

  /**
   * Find entities by criteria
   */
  async findBy(options: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Update an entity
   */
  async update(id: string | number, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  /**
   * Delete an entity
   */
  async delete(id: string | number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  /**
   * Count entities matching criteria
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }
}
