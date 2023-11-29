/**
 * @file Forgot model
 * @module module/forgot/model
*/

import { Types } from 'mongoose';
import { prop, modelOptions } from '@typegoose/typegoose';
import { IsString } from 'class-validator';
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer';
import { User } from '@app/modules/user/user.model';
import { BaseModel } from '@app/models/base.model';

@modelOptions({
  schemaOptions: {
    versionKey: false,
    timestamps: {
      createdAt: 'created_at'
    }
  }
})
export class Forgot extends BaseModel {
  @IsString()
  @prop({ index: true })
  hash: string;

  @prop({ ref: () => User })
  user_id: Types.ObjectId;
}

export const ForgotProvider = getProviderByTypegooseClass(Forgot);
