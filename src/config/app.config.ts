import { registerAs } from '@nestjs/config';
import { AppConfig } from './config.type';
import validateConfig from '@app/utils/validate-config';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT: number;

  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_DOMAIN: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  APP_ALLOW_ORIGINS: string;

  @IsString()
  @IsOptional()
  APP_ALLOW_REFERER: string;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE: string;

  @IsInt()
  @IsOptional()
  APP_DEFAULT_CACHE_TTL: number;

  @IsString()
  @IsOptional()
  APP_ADMIN_EMAIL: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    frontendDomain: process.env.FRONTEND_DOMAIN ?? 'http://localhost:5000',
    backendDomain: process.env.BACKEND_DOMAIN ?? 'http://localhost:3000',
    allowedOrigins: process.env.ALLOWED_ORIGINS ? JSON.parse(process.env.ALLOWED_ORIGINS) : ['*'],
    allowedReferer: process.env.ALLOWED_REFERER || 'localhost:5000',
    port: process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
    defaultCacheTtl: process.env.APP_DEFAULT_CACHE_TTL ? parseInt(process.env.APP_DEFAULT_CACHE_TTL, 10) : 0,
    adminEmail: process.env.APP_ADMIN_EMAIL || 'admin@example.com',
  };
});
