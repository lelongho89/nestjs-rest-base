import { Injectable } from '@nestjs/common';
import { Facebook } from 'fb';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { SocialInterface } from '@app/modules/auth/types/social.interface';
import { FacebookInterface } from './facebook.interface';
import { AuthFacebookLoginDto } from './auth-facebook.dto';

@Injectable()
export class AuthFacebookService {
    private fb: Facebook;

    constructor(private configService: ConfigService<AllConfigType>) {
        this.fb = new Facebook({
            appId: configService.get('facebook.appId', {
                infer: true,
            }),
            appSecret: configService.get('facebook.appSecret', {
                infer: true,
            }),
            version: 'v7.0',
        });
    }

    async getProfileByToken(
        loginDto: AuthFacebookLoginDto,
    ): Promise<SocialInterface> {
        this.fb.setAccessToken(loginDto.accessToken);

        const data: FacebookInterface = await new Promise((resolve) => {
            this.fb.api(
                '/me',
                'get',
                { fields: 'id,last_name,email,first_name' },
                (response) => {
                    resolve(response);
                },
            );
        });

        return {
            id: data.id,
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
        };
    }
}
