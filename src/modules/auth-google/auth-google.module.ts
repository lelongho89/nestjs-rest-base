import { Module } from '@nestjs/common';
import { AuthGoogleService } from './auth-google.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@app/modules/auth/auth.module';
import { AuthGoogleController } from './auth-google.controller';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [AuthGoogleService],
  exports: [AuthGoogleService],
  controllers: [AuthGoogleController],
})
export class AuthGoogleModule {}
