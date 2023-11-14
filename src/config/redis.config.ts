import { registerAs } from '@nestjs/config';
import { RedisConfig } from './config.type';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import validateConfig from '@app/utils/validate-config';

class EnvironmentVariablesValidator {

  @IsString()
  REDIS_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_USERNAME: string;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsString()
  @IsOptional()
  REDIS_NAMESPACE: string;
}

export default registerAs<RedisConfig>('redis', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    namespace: process.env.REDIS_NAMESPACE || 'nest-base',
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  };
});
