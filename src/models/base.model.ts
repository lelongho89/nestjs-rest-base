import { prop } from '@typegoose/typegoose';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongoose';

export class BaseModel {
  _id: ObjectId | string;

  @Expose()
  @Transform((value) => value.obj?._id?.toString(), { toClassOnly: true })
  id: string;

  @Exclude({ toPlainOnly: true })
  @prop({ default: Date.now, immutable: true })
  created_at: Date;

  @Exclude({ toPlainOnly: true })
  @prop({ default: null })
  deleted_at?: Date;
}
