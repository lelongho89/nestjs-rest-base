import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '@app/modules/auth/auth.service';
import { AuthTwitterService } from './auth-twitter.service';
import { AuthTwitterLoginDto } from './auth-twitter.dto';
import { LoginResponseType } from '../auth/types/login-response.type';

@ApiTags('Auth-Twitter')
@Controller({
  path: 'auth/twitter',
  version: '1',
})
export class AuthTwitterController {
  constructor(
    private readonly authService: AuthService,
    private readonly authTwitterService: AuthTwitterService,
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: AuthTwitterLoginDto,
  ): Promise<LoginResponseType> {
    const socialData =
      await this.authTwitterService.getProfileByToken(loginDto);

    return this.authService.validateSocialLogin('twitter', socialData);
  }
}
