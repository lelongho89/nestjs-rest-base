import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@app/modules/auth/auth.module';
import { AuthFacebookService } from './auth-facebook.service';
import { AuthFacebookController } from './auth-facebook.controller';


@Module({
  imports: [ConfigModule, AuthModule],
  providers: [AuthFacebookService],
  exports: [AuthFacebookService],
  controllers: [AuthFacebookController],
})
export class AuthFacebookModule {}
