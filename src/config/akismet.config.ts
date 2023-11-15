import { registerAs } from '@nestjs/config';
import { AkismetConfig } from './config.type';
import {
  IsString,
  IsOptional,
} from 'class-validator';
import validateConfig from '@app/utils/validate-config';

class EnvironmentVariablesValidator {

  @IsString()
  @IsOptional()
  AKISMET_KEY: string;

  @IsString()
  @IsOptional()
  AKISMET_BLOG: string;
}

export default registerAs<AkismetConfig>('akismet', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    key: process.env.AKISMET_KEY || 'your Akismet Key',
    blog: process.env.AKISMET_BLOG || 'your Akismet blog site',
  };
});
