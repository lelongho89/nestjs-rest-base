import { prop, plugin, modelOptions } from '@typegoose/typegoose';
import { AutoIncrementID } from '@typegoose/auto-increment';
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer';
import { generalAutoIncrementIDConfig } from '@app/constants/increment.constant';
import { User } from '@app/modules/user/user.model';

@plugin(AutoIncrementID, generalAutoIncrementIDConfig)
@modelOptions({
  schemaOptions: {
    versionKey: false,
    toObject: { getters: true },
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  }
})
export class Session {
  @prop({ unique: true })
  id: number;

  @prop({ index: true })
  user: User;

  @prop({ default: Date.now, immutable: true })
  created_at: Date;

  @prop()
  deleted_at?: Date;
}

export const SessionProvider = getProviderByTypegooseClass(Session);
