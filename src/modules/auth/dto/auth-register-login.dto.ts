import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCase } from '@app/transformers/value.transformer';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(({ value }) => lowerCase(value))
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string;
}
