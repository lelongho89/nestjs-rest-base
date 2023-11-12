import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    SerializeOptions,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '@app/modules/auth/auth.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthGoogleLoginDto } from './auth-google.dto';
import { LoginResponseType } from '../auth/types/login-response.type';

@ApiTags('Auth')
@Controller({
    path: 'auth/google',
    version: '1',
})
export class AuthGoogleController {
    constructor(
        private readonly authService: AuthService,
        private readonly authGoogleService: AuthGoogleService,
    ) { }

    @SerializeOptions({
        groups: ['me'],
    })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: AuthGoogleLoginDto,
    ): Promise<LoginResponseType> {
        const socialData = await this.authGoogleService.getProfileByToken(loginDto);

        return this.authService.validateSocialLogin('google', socialData);
    }
}
