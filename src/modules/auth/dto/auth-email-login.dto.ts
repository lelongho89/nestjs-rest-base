import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCase } from '@app/transformers/value.transformer';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(({ value }) => lowerCase(value))
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
