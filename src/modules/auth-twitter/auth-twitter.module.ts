import { Module } from '@nestjs/common';
import { AuthTwitterService } from './auth-twitter.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@app/modules/auth/auth.module';
import { AuthTwitterController } from './auth-twitter.controller';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [AuthTwitterService],
  exports: [AuthTwitterService],
  controllers: [AuthTwitterController],
})
export class AuthTwitterModule {}
