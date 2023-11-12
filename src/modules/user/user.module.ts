/**
 * @file User module
 * @module module/user/module
*/

import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserProvider } from './user.model';

@Module({
  controllers: [UserController],
  providers: [UserProvider, UserService],
  exports: [UserService],
})
export class UserModule { }

