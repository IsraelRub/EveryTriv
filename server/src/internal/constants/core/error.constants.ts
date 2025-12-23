/**
 * Server Core Error Constants
 * @module ServerCoreErrorConstants
 * @description Server-side error constants
 */

// Error constants (server-only)
export const NEST_EXCEPTION_NAMES = [
	'BadGatewayException',
	'BadRequestException',
	'ConflictException',
	'ForbiddenException',
	'GatewayTimeoutException',
	'GoneException',
	'HttpException',
	'HttpVersionNotSupportedException',
	'ImATeapotException',
	'InternalServerErrorException',
	'IntrinsicException',
	'MethodNotAllowedException',
	'MisdirectedException',
	'NotAcceptableException',
	'NotFoundException',
	'NotImplementedException',
	'PayloadTooLargeException',
	'PreconditionFailedException',
	'RequestTimeoutException',
	'ServiceUnavailableException',
	'UnauthorizedException',
	'UnprocessableEntityException',
	'UnsupportedMediaTypeException',
] as const;

// Error logging context (server-only)
export const ERROR_LOGGING_CONTEXT = {
	GROQ_PROVIDER: 'GroqTriviaProvider',
	QUESTION_GENERATION: 'question_generation',
} as const;
