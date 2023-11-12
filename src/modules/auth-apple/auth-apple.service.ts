import { Injectable } from '@nestjs/common';
import appleSigninAuth from 'apple-signin-auth';
import { ConfigService } from '@nestjs/config';
import { SocialInterface } from '../auth/types/social.interface';
import { AuthAppleLoginDto } from './auth-apple.dto';
import { AllConfigType } from '@app/config/config.type';

@Injectable()
export class AuthAppleService {
    constructor(private configService: ConfigService<AllConfigType>) { }

    async getProfileByToken(
        loginDto: AuthAppleLoginDto,
    ): Promise<SocialInterface> {
        const data = await appleSigninAuth.verifyIdToken(loginDto.idToken, {
            audience: this.configService.get('apple.appAudience', { infer: true }),
        });

        return {
            id: data.sub,
            email: data.email,
            firstName: loginDto.firstName,
            lastName: loginDto.lastName,
        };
    }
}
