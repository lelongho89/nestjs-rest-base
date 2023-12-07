/**
 * @file User DTO
 * @module module/user/dto
*/
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IntersectionType } from '@nestjs/mapped-types'
import { KeywordQueryDTO } from '@app/models/query.model'
import { PaginateOptionWithHotSortDTO } from '@app/models/paginate.model'
import { lowerCase } from '@app/transformers/value.transformer';
import { RoleEnum, StatusEnum } from '@app/constants/biz.constant';

export class UserPaginateQueryDTO extends IntersectionType(PaginateOptionWithHotSortDTO, KeywordQueryDTO) { }

export class CreateUserDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(({ value }) => lowerCase(value))
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty()
  @MinLength(6)
  password?: string;

  provider?: string;

  social_id?: string | null;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  first_name: string | null;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  last_name: string | null;

  @ApiProperty({ example: 'http://status.example.com/image.jpg' })
  @IsOptional()
  photo?: string | null;

  @ApiProperty({ enum: () => RoleEnum })
  role?: RoleEnum | null;

  @ApiProperty({ enum: () => StatusEnum })
  status?: StatusEnum;

  hash?: string | null;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(({ value }) => lowerCase(value))
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty()
  @IsOptional()
  @MinLength(6)
  password?: string;

  provider?: string;

  social_id?: string | null;

  @ApiProperty({ example: 'John' })
  @IsOptional()
  first_name?: string | null;

  @ApiProperty({ example: 'Doe' })
  @IsOptional()
  last_name?: string | null;

  @ApiProperty({ example: 'http://status.example.com/image.jpg' })
  @IsOptional()
  photo?: string | null;

  @ApiProperty({ enum: () => RoleEnum })
  @IsOptional()
  role?: RoleEnum | null;

  @ApiProperty({ enum: () => StatusEnum })
  @IsOptional()
  status?: StatusEnum;

  hash?: string | null;
}

