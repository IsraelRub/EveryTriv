import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

import { isGameDifficulty } from '@shared/validation';

export function IsGameDifficulty(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: 'isGameDifficulty',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: unknown) {
					return isGameDifficulty(value);
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be a valid difficulty level (easy, medium, hard) or a custom difficulty`;
				},
			},
		});
	};
}
