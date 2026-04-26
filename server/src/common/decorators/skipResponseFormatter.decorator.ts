import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_FORMATTER_KEY = 'skipResponseFormatter';

export const SkipResponseFormatter = () => SetMetadata(SKIP_RESPONSE_FORMATTER_KEY, true);
