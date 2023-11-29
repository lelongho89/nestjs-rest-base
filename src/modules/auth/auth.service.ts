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
import { MongooseDoc } from '@app/interfaces/mongoose.interface';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { RoleEnum, StatusEnum } from '@app/constants/biz.constant';
import { UserService } from '@app/modules/user/user.service';
import { ForgotService } from '@app/modules/forgot/forgot.service';
import { MailService } from '@app/modules/mail/mail.service';
import { FileService } from '@app/modules/file/file.service';
import { User } from '@app/modules/user/user.model';
import { Forgot } from '@app/modules/forgot/forgot.model';
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
  private SALT_ROUND = 10;
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private forgotService: ForgotService,
    private mailService: MailService,
    private fileService: FileService,
    private configService: ConfigService<AllConfigType>,
  ) { }

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseType> {
    const user = await this.userService.findOneByCondition({
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

    const { token, refresh_token, token_expires } = await this.getTokensData({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken(user.id, refresh_token);

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
      userByEmail = await this.userService.findOneByCondition({
        email: socialEmail,
      });
    }

    if (socialData.id) {
      user = await this.userService.findOneByCondition({
        social_id: socialData.id,
        provider: authProvider,
      });
    }

    if (user) {
      if (socialEmail && !userByEmail) {
        user.email = socialEmail;
      }
      await this.userService.update(user._id.toString(), { email: socialEmail, first_name: socialData.firstName, last_name: socialData.lastName });
    } else if (userByEmail) {
      user = userByEmail;
    } else {
      user = await this.userService.create({
        email: socialEmail ?? null,
        first_name: socialData.firstName ?? null,
        last_name: socialData.lastName ?? null,
        social_id: socialData.id,
        provider: authProvider,
        role: RoleEnum.User,
        status: StatusEnum.Active,
      });

      user = await this.userService.findOneByCondition({
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

    const {
      token,
      refresh_token,
      token_expires,
    } = await this.getTokensData({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken(user._id.toString(), refresh_token);

    return {
      token,
      refresh_token,
      token_expires,
      user,
    };
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {

    const user = await this.userService.findOneByCondition({ email: dto.email });
    if (user) {
      throw 'emailAlreadyExists'
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await this.userService.create({
      ...dto,
      email: dto.email,
      password: await this.getPasswordHash(dto.password),
      role: RoleEnum.User,
      status: StatusEnum.Inactive,
      hash
    });

    await this.mailService.userSignUp({
      to: dto.email,
      data: {
        hash,
      },
    });
  }

  async confirmEmail(hash: string): Promise<void> {
    const user = await this.userService.findOneByCondition({
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

    await this.userService.update(user.id, { hash: null, status: StatusEnum.Active });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findOneByCondition({ email });
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
    const forgot = await this.forgotService.findOne({ hash });

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

    const user = await this.userService.findOne(forgot.user_id.toString());

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

    await this.userService.update(user._id.toString(), { password: await this.getPasswordHash(password) });
    await this.userService.removeRefreshToken(user._id.toString());
    await this.forgotService.delete(forgot._id.toString());
  }

  async me(userJwtPayload: JwtPayloadType): Promise<MongooseDoc<User>> {
    return this.userService.findOne(userJwtPayload.id);
  }

  async update(userJwtPayload: JwtPayloadType, userDto: AuthUpdateDto): Promise<MongooseDoc<User>> {

    const currentUser = await this.userService.findOne(userJwtPayload.id);

    if (userDto.password) {
      if (userDto.old_password) {

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
          userDto.old_password,
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

    if (userDto.photo && userDto.photo.id) {
      const photo = await this.fileService.getById(userDto.photo.id);

      if (!photo) {
        throw 'imageNotExists';
      }
    }

    return await this.userService.update(currentUser._id.toString(), userDto);
  }

  async refreshToken(user: User): Promise<Omit<LoginResponseType, 'user'>> {

    const { token, refresh_token, token_expires } = await this.getTokensData({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken(user._id.toString(), refresh_token);

    return {
      token,
      refresh_token,
      token_expires,
    };
  }

  async delete(data: Pick<JwtPayloadType, 'id'>) {
    await this.userService.softDelete(data.id);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'id'>) {
    return this.userService.removeRefreshToken(data.id);
  }

  async getUserIfRefreshTokenMatched(
    user_id: string,
    refresh_token: string,
  ): Promise<User> {
    try {
      const user = await this.userService.findOne(user_id);
      if (!user) {
        throw new UnauthorizedException();
      }

      const isRefreshTokenMatching = await bcrypt.compare(refresh_token, user.refresh_token);
      if (isRefreshTokenMatching) {
        return user;
      } else {
        throw new UnauthorizedException();
      }

    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  private async getTokensData(data: {
    id: User['id'];
    email: User['email'];
    role: User['role'];
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          email: data.email,
          role: data.role,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          id: data.id,
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

  private async getPasswordHash(password: string) {
    return await bcrypt.hash(password, this.SALT_ROUND);
  }

  private async storeRefreshToken(user_id: string, token: string): Promise<void> {
    try {
      const hashed_token = await bcrypt.hash(token, this.SALT_ROUND);
      await this.userService.setCurrentRefreshToken(user_id, hashed_token);
    } catch (error) {
      throw error;
    }
  }
}
