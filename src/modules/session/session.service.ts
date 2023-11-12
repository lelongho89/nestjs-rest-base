import { FilterQuery } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@app/transformers/model.transformer'
import { MongooseModel, MongooseDoc } from '@app/interfaces/mongoose.interface';
import { Session } from './session.model';
import { User } from '@app/modules/user/user.model';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session) private readonly sessionModel: MongooseModel<Session>,
  ) { }

  public async findOne(filters: FilterQuery<Session>): Promise<MongooseDoc<Session>> {
    return this.sessionModel.findOne({ ...filters }).exec().then(result => result || Promise.reject('Session not found'));
  }

  public async findMany(filters: FilterQuery<Session>): Promise<Session[]> {
    return this.sessionModel.find({ ...filters });
  }

  async create(data: Partial<Session>): Promise<Session> {
    return this.sessionModel.create(data);
  }

  async delete({
    excludeId,
    ...criteria
  }: {
    id?: Session['id'];
    user?: Pick<User, 'id'>;
    excludeId?: Session['id'];
  }): Promise<void> {
    await this.sessionModel.find({
      ...criteria,
      id: criteria.id ? criteria.id : excludeId ? { $ne: excludeId } : undefined
    });
  }
}
