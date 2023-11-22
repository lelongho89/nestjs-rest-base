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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';

@Module({
  imports: [
    UserModule,
    ForgotModule,
    SessionModule,
    PassportModule,
    MailModule,
    FileModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        secretOrPrivateKey: configService.getOrThrow('auth.secret', { infer: true }),
        signOptions: { expiresIn: configService.getOrThrow('auth.expires', { infer: true }) },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy
  ],
  exports: [AuthService],
})
export class AuthModule { }
