import { registerAs } from '@nestjs/config';
import { DisqusConfig } from './config.type';
import {
  IsString,
  IsOptional,
} from 'class-validator';
import validateConfig from '@app/utils/validate-config';

class EnvironmentVariablesValidator {

  @IsString()
  DISQUS_ADMIN_ACCESS_TOKEN: string;

  @IsString()
  @IsOptional()
  DISQUS_ADMIN_USERNAME: string;

  @IsString()
  @IsOptional()
  DISQUS_FORUM_SHORTNAME: string;

  @IsString()
  @IsOptional()
  DISQUS_PUBLIC_KEY: string;

  @IsString()
  @IsOptional()
  DISQUS_SECRET_KEY: string;
}

export default registerAs<DisqusConfig>('disqus', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    // https://disqus.com/api/applications/<app_id> & Keep permissions: <Read, Write, Manage Forums>
    adminAccessToken: process.env.DISQUS_ADMIN_ACCESS_TOKEN || 'Disqus admin access_token',
    adminUsername: process.env.DISQUS_ADMIN_USERNAME || 'Disqus admin username',
    forum: process.env.DISQUS_FORUM_SHORTNAME || 'Disqus forum shortname',
    // https://disqus.com/api/applications/
    publicKey: process.env.DISQUS_PUBLIC_KEY || 'Disqus application public_key',
    secretKey: process.env.DISQUS_SECRET_KEY || 'Disqus application secret_key'
  };
});
