import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './config.type';
import {
  IsString,
  ValidateIf,
} from 'class-validator';
import validateConfig from '@app/utils/validate-config';

class EnvironmentVariablesValidator {
  @ValidateIf((envValues) => envValues.DATABASE_URL)
  @IsString()
  DATABASE_URL: string;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    url: process.env.DATABASE_URL
  };
});
