import { envConfig } from './environment.config';

export const environment = {
  ...envConfig,
  production: true,
} as const;
