import { prop, modelOptions } from '@typegoose/typegoose';
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer';
import { Exclude } from 'class-transformer';
import { BaseModel } from '@app/models/base.model';

@modelOptions({
  schemaOptions: {
    collection: 'files',
    versionKey: false,
    toJSON: { getters: true },
    toObject: { getters: true },
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
})
export class FileEntity extends BaseModel {
  @prop()
  path: string;

  @Exclude()
  @prop({ default: Date.now })
  updated_at?: Date
}

export const FileEntityProvider = getProviderByTypegooseClass(FileEntity)
