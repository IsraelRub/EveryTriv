/**
 * Symbols needed by `client/vite.config.ts`. Import only from `../shared/vite-config-constants`
 * (one path segment under `shared/`) so the config bundle does not load the full `constants` barrel.
 */
export { APP_NAME } from './constants/core/app.constants';
export { VITE_API_BUNDLE_USE_ORIGIN_PREFIX } from './constants/core/api.constants';
export { TIME_PERIODS_MS } from './constants/core/time.constants';
export { HttpMethod } from './constants/infrastructure/http.constants';
export { LOCALHOST_CONFIG } from './constants/infrastructure/localhost.constants';
