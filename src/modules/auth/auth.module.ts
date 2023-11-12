import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { UserModule } from '@app/modules/user/user.module';
import { ForgotModule } from '@app/modules/forgot/forgot.module';
import { MailModule } from '@app/modules/mail/mail.module';
import { SessionModule } from '@app/modules/session/session.module';
import { FileModule } from '@app/modules/file/file.module';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UserModule,
    ForgotModule,
    SessionModule,
    PassportModule,
    MailModule,
    FileModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule { }
