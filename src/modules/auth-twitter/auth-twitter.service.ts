import Twitter from 'twitter';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { SocialInterface } from '../auth/types/social.interface';
import { AuthTwitterLoginDto } from './auth-twitter.dto';

@Injectable()
export class AuthTwitterService {
    constructor(private configService: ConfigService<AllConfigType>) { }

    async getProfileByToken(
        loginDto: AuthTwitterLoginDto,
    ): Promise<SocialInterface> {
        const twitter = new Twitter({
            consumer_key: this.configService.getOrThrow('twitter.consumerKey', {
                infer: true,
            }),
            consumer_secret: this.configService.getOrThrow('twitter.consumerSecret', {
                infer: true,
            }),
            access_token_key: loginDto.accessTokenKey,
            access_token_secret: loginDto.accessTokenSecret,
        });

        const data: Twitter.ResponseData = await new Promise((resolve) => {
            twitter.get(
                'account/verify_credentials',
                { include_email: true },
                (error, profile) => {
                    resolve(profile);
                },
            );
        });

        return {
            id: data.id.toString(),
            email: data.email,
            firstName: data.name,
        };
    }
}
