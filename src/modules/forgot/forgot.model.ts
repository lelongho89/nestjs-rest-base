/**
 * @file Forgot model
 * @module module/forgot/model
*/

import { AutoIncrementID } from '@typegoose/auto-increment';
import { prop, plugin, modelOptions } from '@typegoose/typegoose';
import { IsString } from 'class-validator';
import { generalAutoIncrementIDConfig } from '@app/constants/increment.constant';
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer';
import { User } from '@app/modules/user/user.model';

@plugin(AutoIncrementID, generalAutoIncrementIDConfig)
@modelOptions({
  schemaOptions: {
    versionKey: false,
    timestamps: {
      createdAt: 'created_at'
    }
  }
})
export class Forgot {
  @prop({ unique: true })
  id: number;

  @IsString()
  @prop({ index: true })
  hash: string;

  @prop()
  user: User;

  @prop()
  created_at: Date;

  @prop()
  deleted_at: Date;
}

export const ForgotProvider = getProviderByTypegooseClass(Forgot);
