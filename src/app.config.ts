/**
 * @file App config
 * @module app/config
*/

import path from 'path'
import yargs from 'yargs'

const argv = yargs.argv as Record<string, string | void>
const ROOT_PATH = path.join(__dirname, '..')

export const APP = {
  PORT: 8000,
  ROOT_PATH,
  DEFAULT_CACHE_TTL: 0,
  NAME: 'API',
  URL: 'https://api.example.com',
  ADMIN_EMAIL: argv.admin_email || 'admin email, e.g. admin@example.com',
  FE_NAME: argv.fe_name || 'FE',
  FE_URL: argv.fe_url || 'https://example.com',
  STATIC_URL: 'https://static.example.com'
}

export const DISQUS = {
  // https://disqus.com/api/applications/<app_id> & Keep permissions: <Read, Write, Manage Forums>
  adminAccessToken: argv.disqus_admin_access_token || 'Disqus admin access_token',
  adminUsername: argv.disqus_admin_username || 'Disqus admin username',
  forum: argv.disqus_forum_shortname || 'Disqus forum shortname',
  // https://disqus.com/api/applications/
  publicKey: argv.disqus_public_key || 'Disqus application public_key',
  secretKey: argv.disqus_secret_key || 'Disqus application secret_key'
}

export const GOOGLE = {
  jwtServiceAccountCredentials: argv.google_jwt_cred_json ? JSON.parse(argv.google_jwt_cred_json as string) : null
}

export const AWS = {
  accessKeyId: argv.aws_access_key_id as string,
  secretAccessKey: argv.aws_secret_access_key as string,
  s3StaticRegion: argv.aws_s3_static_region as string,
  s3StaticBucket: argv.aws_s3_static_bucket as string
}

export const DB_BACKUP = {
  s3Region: argv.db_backup_s3_region as string,
  s3Bucket: argv.db_backup_s3_bucket as string,
  password: argv.db_backup_file_password as string
}
