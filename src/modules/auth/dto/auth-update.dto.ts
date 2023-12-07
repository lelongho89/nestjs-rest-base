import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class AuthUpdateDto {
  @ApiProperty({ example: 'http://status.example.com/image.jpg' })
  @IsOptional()
  photo?: string;

  @ApiProperty({ example: 'John' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  first_name?: string;

  @ApiProperty({ example: 'Doe' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  last_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  old_password: string;
}
