import { envConfig } from './environment.config';

/** Development. Uses same Supabase config as production (see environment.config.ts). */
export const environment = {
  ...envConfig,
  production: false,
} as const;
