import ms from 'ms';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { MongooseDoc, MongooseModel } from '@app/interfaces/mongoose.interface';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { RoleEnum, StatusEnum } from '@app/constants/biz.constant';
import { UserService } from '@app/modules/user/user.service';
import { ForgotService } from '@app/modules/forgot/forgot.service';
import { SessionService } from '@app/modules/session/session.service';
import { MailService } from '@app/modules/mail/mail.service';
import { FileService } from '@app/modules/file/file.service';
import { User } from '@app/modules/user/user.model';
import { Forgot } from '@app/modules/forgot/forgot.model';
import { Session } from '@app/modules/session/session.model';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SocialInterface } from './types/social.interface';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { LoginResponseType } from './types/login-response.type';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private forgotService: ForgotService,
    private sessionService: SessionService,
    private mailService: MailService,
    private fileService: FileService,
    private configService: ConfigService<AllConfigType>,
  ) { }

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
    const user = await this.userService.findOne({
      email: loginDto.email,
    });

    if (!user) {
      throw 'emailNotExists';
    }

    if (user.provider !== AuthProvidersEnum.email) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: `needLoginViaProvider:${user.provider}`,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: 'incorrectPassword',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const session = await this.sessionService.create({
      user,
    });

    const { token, refresh_token, token_expires } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      token,
      refresh_token,
      token_expires,
      user,
    };
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<LoginResponseType> {
    let user: MongooseDoc<User> | null = null;
    let userByEmail: MongooseDoc<User> | null = null;

    const socialEmail = socialData.email?.toLowerCase();

    if (socialEmail) {
      userByEmail = await this.userService.findOne({
        email: socialEmail,
      });
    }

    if (socialData.id) {
      user = await this.userService.findOne({
        social_id: socialData.id,
        provider: authProvider,
      });
    }

    if (user) {
      if (socialEmail && !userByEmail) {
        user.email = socialEmail;
      }
      await this.userService.update(user._id, user);
    } else if (userByEmail) {
      user = userByEmail;
    } else {
      user = await this.userService.create(plainToClass(User, {
        email: socialEmail ?? null,
        first_name: socialData.firstName ?? null,
        last_name: socialData.lastName ?? null,
        social_id: socialData.id,
        provider: authProvider,
        role: RoleEnum.User,
        status: StatusEnum.Active,
      }));

      user = await this.userService.findOne({
        id: user.id,
      });
    }

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'userNotFound',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const session = await this.sessionService.create({
      user,
    });

    const {
      token,
      refresh_token,
      token_expires,
    } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      token,
      refresh_token,
      token_expires,
      user,
    };
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {

    const user = await this.userService.findOne({ email: dto.email });
    if (user) {
      throw 'emailAlreadyExists'
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await this.userService.create(plainToClass(User, {
      ...dto,
      email: dto.email,
      password: await this.getHashPassword(dto.password),
      role: RoleEnum.User,
      status: StatusEnum.Inactive,
      hash
    }));

    await this.mailService.userSignUp({
      to: dto.email,
      data: {
        hash,
      },
    });
  }

  async confirmEmail(hash: string): Promise<void> {
    const user = await this.userService.findOne({
      hash,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: `notFound`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userService.update(user._id, { hash: null, status: StatusEnum.Active });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findOne({ email });
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailNotExists',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await this.forgotService.create(plainToClass(Forgot, {
      hash,
      user,
    }));

    await this.mailService.forgotPassword({
      to: email,
      data: {
        hash,
      },
    });
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: `notFound`,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const user = await this.userService.findOne({ id: forgot.user.id });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'notFound',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.sessionService.delete({
      user: {
        id: user.id,
      },
    });
    await this.userService.update(user._id, { password: await this.getHashPassword(password) });
    await this.forgotService.delete(forgot._id);
  }

  async me(userJwtPayload: JwtPayloadType): Promise<MongooseDoc<User>> {
    return this.userService.findOne({
      id: userJwtPayload.id,
    });
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthUpdateDto,
  ): Promise<MongooseDoc<User>> {

    const currentUser = await this.userService.findOne({
      id: userJwtPayload.id,
    });

    if (userDto.password) {
      if (userDto.oldPassword) {

        if (!currentUser) {
          throw new HttpException(
            {
              status: HttpStatus.UNPROCESSABLE_ENTITY,
              errors: {
                user: 'userNotFound',
              },
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        const isValidOldPassword = await bcrypt.compare(
          userDto.oldPassword,
          currentUser.password,
        );

        if (!isValidOldPassword) {
          throw new HttpException(
            {
              status: HttpStatus.UNPROCESSABLE_ENTITY,
              errors: {
                oldPassword: 'incorrectOldPassword',
              },
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        } else {
          await this.sessionService.delete({
            user: {
              id: currentUser.id,
            },
            excludeId: userJwtPayload.sessionId,
          });
        }


      } else {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              oldPassword: 'missingOldPassword',
            },
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    if (userDto.photo) {
      const photo = await this.fileService.getById(userDto.photo.id);

      if (!photo) {
        throw 'imageNotExists';
      }
    }

    await this.userService.update(currentUser._id, userDto);

    return this.userService.getById(currentUser._id);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId'>,
  ): Promise<Omit<LoginResponseType, 'user'>> {
    const session = await this.sessionService.findOne({
      where: {
        id: data.sessionId,
      },
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    const { token, refresh_token, token_expires } = await this.getTokensData({
      id: session.user.id,
      role: session.user.role,
      sessionId: session.id,
    });

    return {
      token,
      refresh_token,
      token_expires,
    };
  }

  async delete(user: User): Promise<void> {
    await this.userService.softDelete(user.id);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.delete({
      id: data.sessionId,
    });
  }

  private async getTokensData(data: {
    id: User['id'];
    role: User['role'];
    sessionId: Session['id'];
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refresh_token: refreshToken,
      token_expires: tokenExpires,
    };
  }

  private async getHashPassword(password: string) {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }
}
