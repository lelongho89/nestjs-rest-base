import path from 'path';
import { registerAs } from '@nestjs/config';
import { ProjectConfig } from './config.type';

export default registerAs<ProjectConfig>('project', () => {
  const packageJSON = require(path.resolve(process.env.PWD || process.cwd(), 'package.json'))
  return {
    name: packageJSON.name,
    version: packageJSON.version,
    author: packageJSON.author
  };
});
