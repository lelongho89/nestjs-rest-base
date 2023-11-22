import { AutoIncrementID } from '@typegoose/auto-increment';
import { prop, plugin, modelOptions } from '@typegoose/typegoose';
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer';
import { Exclude } from 'class-transformer';
import { generalAutoIncrementIDConfig } from '@app/constants/increment.constant';

@plugin(AutoIncrementID, generalAutoIncrementIDConfig)
@modelOptions({
  schemaOptions: {
    collection: 'files',
    versionKey: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
})
export class FileEntity {
  @prop({ unique: true })
  id: number;

  @prop()
  path: string;

  @Exclude()
  @prop({ default: Date.now, immutable: true })
  created_at?: Date

  @Exclude()
  @prop({ default: Date.now })
  updated_at?: Date
}

export const FileEntityProvider = getProviderByTypegooseClass(FileEntity)
