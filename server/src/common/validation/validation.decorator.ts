/**
 * Validation Decorators
 *
 * @module validation.decorator
 * @description Custom validation decorators for NestJS controllers
 */
import { BadRequestException, createParamDecorator,ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { getValidationSchema,type SchemaName } from 'everytriv-shared/validation/schemas';

/**
 * Validation options interface
 */
export interface ValidationOptions {
	/** Error message to display */
	errorMessage?: string;
	/** Whether to strip unknown properties */
	stripUnknown?: boolean;
	/** Whether to transform the data */
	transform?: boolean;
}

/**
 * Validate request data with schema
 * @param schema Schema name
 * @param options Validation options
 * @returns Parameter decorator
 */
export const ValidateWithSchema = (schema: SchemaName, options: ValidationOptions = {}) => {
	return createParamDecorator(async (ctx: ExecutionContext) => {
		try {
			const request = ctx.switchToHttp().getRequest();
			const body = request.body || request.query || request.params;

			// Get validation schema
			const validationSchema = getValidationSchema(schema);
			if (!validationSchema) {
				throw new BadRequestException(`Validation schema '${schema}' not found`);
			}

			// Create a class from the schema
			const ValidationClass = class {
				constructor(data: Record<string, unknown>) {
					Object.assign(this, data);
				}
			};

			// Add properties from schema to the class
			if (validationSchema.properties) {
				Object.keys(validationSchema.properties).forEach(key => {
					Object.defineProperty(ValidationClass.prototype, key, {
						writable: true,
						enumerable: true,
					});
				});
			}

			// Transform and validate
			const transformedData = options.transform
				? plainToClass(ValidationClass, body, {
						excludeExtraneousValues: options.stripUnknown ?? true,
					})
				: body;

			const errors = await validate(transformedData);

			if (errors.length > 0) {
				const errorMessages = errors.map(error => {
					const constraints = error.constraints;
					return constraints ? Object.values(constraints).join(', ') : 'Validation failed';
				});

				throw new BadRequestException({
					message: options.errorMessage || 'Validation failed',
					errors: errorMessages,
					schema,
				});
			}

			return transformedData;
		} catch (error: unknown) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException({
				message: 'Validation error',
				error: error instanceof Error ? error.message : String(error),
				schema,
			});
		}
	});
};

/**
 * Validate request body with schema
 * @param schema Schema name
 * @param options Additional options
 * @returns Parameter decorator
 */
export const ValidateBody = (schema: SchemaName, options: ValidationOptions = {}) => {
	return createParamDecorator(async (ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		request.body = await ValidateWithSchema(schema, options)(ctx);
		return request.body;
	});
};

/**
 * Validate request query with schema
 * @param schema Schema name
 * @param options Additional options
 * @returns Parameter decorator
 */
export const ValidateQuery = (schema: SchemaName, options: ValidationOptions = {}) => {
	return createParamDecorator(async (ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		request.query = await ValidateWithSchema(schema, options)(ctx);
		return request.query;
	});
};

/**
 * Validate request params with schema
 * @param schema Schema name
 * @param options Additional options
 * @returns Parameter decorator
 */
export const ValidateParams = (schema: SchemaName, options: ValidationOptions = {}) => {
	return createParamDecorator(async (ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		request.params = await ValidateWithSchema(schema, options)(ctx);
		return request.params;
	});
};
