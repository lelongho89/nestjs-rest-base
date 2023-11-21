/**
 * @file User model
 * @module module/user/model
*/

import bcrypt from 'bcryptjs';
import { AutoIncrementID } from '@typegoose/auto-increment'
import { prop, plugin, modelOptions, Severity } from '@typegoose/typegoose'
import { IsString, IsDefined, IsIn, IsInt, IsEmail, IsOptional } from 'class-validator'
import { Exclude, Expose } from 'class-transformer';
import { generalAutoIncrementIDConfig } from '@app/constants/increment.constant'
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer'
import { mongoosePaginate } from '@app/utils/paginate'
import { StatusEnum } from '@app/constants/biz.constant'
import { AuthProvidersEnum } from '@app/modules/auth/auth-providers.enum';
import { RoleEnum } from '@app/constants/biz.constant';
import { FileEntity } from '@app/modules/file/file.model';


export const USER_STATES = [StatusEnum.Active, StatusEnum.Inactive] as const

@plugin(mongoosePaginate)
@plugin(AutoIncrementID, generalAutoIncrementIDConfig)
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
export class User {
  @prop({ unique: true })
  id: number

  @IsString()
  @IsEmail()
  @prop({ required: false, unique: true })
  email: string | null

  @Exclude({ toPlainOnly: true })
  @IsOptional()
  @IsString()
  @prop({ required: false })
  password: string | null

  @Exclude({ toPlainOnly: true })
  public previous_password: string;

  @Expose()
  async setPassword() {
    if (this.previous_password !== this.password && this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @Expose({ groups: ['me', 'admin'] })
  @prop({ required: true, default: AuthProvidersEnum.email })
  provider: string;

  @Expose({ groups: ['me', 'admin'] })
  @IsString()
  @prop({ required: false, index: true })
  social_id: string | null;

  @IsString()
  @prop({ required: false, index: true })
  first_name: string | null;

  @IsString()
  @prop({ required: false, index: true })
  last_name: string | null;

  @prop({ required: false, type: FileEntity })
  photo?: FileEntity | null;

  @prop({ required: false })
  role?: RoleEnum | null;

  @IsIn(USER_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: StatusEnum, default: StatusEnum.Active, index: true })
  status: StatusEnum;

  @Exclude({ toPlainOnly: true })
  @IsString()
  @prop({ required: false, index: true })
  hash: string | null;

  @prop({ default: Date.now, immutable: true })
  created_at?: Date

  @prop({ default: Date.now })
  updated_at?: Date

  @prop()
  deleted_at?: Date
}

export const UserProvider = getProviderByTypegooseClass(User)
