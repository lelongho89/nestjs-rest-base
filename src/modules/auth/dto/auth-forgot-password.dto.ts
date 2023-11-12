import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCase } from '@app/transformers/value.transformer';

export class AuthForgotPasswordDto {
  @ApiProperty()
  @Transform(({ value }) => lowerCase(value))
  @IsEmail()
  email: string;
}
