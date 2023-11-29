/**
 * @file User model
 * @module module/user/model
*/

import { prop, plugin, modelOptions, Severity } from '@typegoose/typegoose'
import { IsString, IsDefined, IsIn, IsInt, IsEmail, IsOptional } from 'class-validator'
import { Exclude, Expose, Transform } from 'class-transformer';
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer'
import { mongoosePaginate } from '@app/utils/paginate'
import { StatusEnum } from '@app/constants/biz.constant'
import { AuthProvidersEnum } from '@app/modules/auth/auth-providers.enum';
import { RoleEnum } from '@app/constants/biz.constant';
import { FileEntity } from '@app/modules/file/file.model';
import { BaseModel } from '@app/models/base.model';

export const USER_STATES = [StatusEnum.Active, StatusEnum.Inactive] as const

@plugin(mongoosePaginate)
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
  schemaOptions: {
    versionKey: false,
    toObject: { getters: true },
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  }
})
export class User extends BaseModel {
  @IsString()
  @IsEmail()
  @prop({ required: false, unique: true })
  email: string | null

  @Exclude({ toPlainOnly: true })
  @IsOptional()
  @IsString()
  @prop({ required: false })
  password: string | null

  @Expose({ groups: ['me', 'admin'] })
  @prop({ required: true, default: AuthProvidersEnum.email })
  provider: string;

  @Expose({ groups: ['me', 'admin'] })
  @IsString()
  @prop({ index: true })
  social_id: string | null;

  @IsString()
  @prop({ index: true })
  first_name: string | null;

  @IsString()
  @prop({ index: true })
  last_name: string | null;

  @prop({ type: () => FileEntity })
  photo?: FileEntity;

  @prop()
  role?: RoleEnum | null;

  @IsIn(USER_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: StatusEnum, default: StatusEnum.Active, index: true })
  status: StatusEnum;

  @Exclude({ toPlainOnly: true })
  @IsString()
  @prop({ index: true })
  hash: string | null;

  @Exclude({ toPlainOnly: true })
  @IsString()
  @prop()
  refresh_token?: string | null;

  @prop({ default: Date.now })
  updated_at?: Date
}

export const UserProvider = getProviderByTypegooseClass(User)
