import { BadRequestException, ValidationPipe } from '@nestjs/common';

export function createAppValidationPipe(): ValidationPipe {
	return new ValidationPipe({
		transform: true,
		whitelist: true,
		forbidNonWhitelisted: true,
		skipMissingProperties: false,
		skipNullProperties: false,
		skipUndefinedProperties: false,
		exceptionFactory: errors => {
			const result = errors.map(error => ({
				property: error.property,
				value: error.value,
				constraints: error.constraints,
			}));
			return new BadRequestException({
				message: 'Validation failed',
				errors: result,
			});
		},
	});
}
