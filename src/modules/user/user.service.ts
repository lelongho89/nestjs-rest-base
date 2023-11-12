import { FilterQuery } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { MongooseModel, MongooseDoc, MongooseID } from '@app/interfaces/mongoose.interface';
import { InjectModel } from '@app/transformers/model.transformer';
import { PaginateResult, PaginateQuery, PaginateOptions } from '@app/utils/paginate';
import { User } from './user.model';
import { StatusEnum } from '@app/constants/biz.constant';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: MongooseModel<User>
  ) { }

  public async create(newUser: User): Promise<MongooseDoc<User>> {
    return this.userModel.create(newUser);
  }

  public async update(userID: MongooseID, newUser: Partial<User>): Promise<MongooseDoc<User>> {
    const user = await this.userModel.findByIdAndUpdate(userID, newUser, { new: true }).exec()
    if (!user) {
      throw `User '${userID}' not found`
    }
    return user;
  }

  public async findOne(filters: FilterQuery<User>): Promise<MongooseDoc<User>> {
    return await this.userModel
      .findOne({ ...filters, deleted_at: null })
      .exec()
      .then((result) => result || Promise.reject(`User not found`));
  }

  public async getById(userID: MongooseID): Promise<MongooseDoc<User>> {
    return this.userModel
      .findById(userID)
      .exec()
      .then((result) => (result?.deleted_at ? null : result) || Promise.reject(`User '${userID}' not found`));
  }

  public async getByEmail(email: string): Promise<MongooseDoc<User>> {
    return this.userModel
      .findOne({ email, deleted_at: null })
      .exec()
      .then(result => result || Promise.reject(`User not found`));
  }

  public async getByHash(hash: string): Promise<MongooseDoc<User>> {
    return this.userModel
      .findOne({ hash, deleted_at: null })
      .exec()
      .then(result => result || Promise.reject(`User not found`));
  }

  public async softDelete(userID: MongooseID | number): Promise<boolean> {
    const deletedUser = await this.userModel.findById(userID);
    if (!deletedUser) {
      return false;
    }
    return !!(await this.userModel.findByIdAndUpdate(userID, { deleted_at: new Date() }).exec());
  }

  public async permanentlyDelete(userID: MongooseID): Promise<boolean> {
    const deletedUser = await this.userModel.findById(userID);
    if (!deletedUser) {
      return false;
    }
    return !!(await this.userModel.findOneAndDelete({ _id: userID }));
  }

  // get paginate users
  public paginator(query: PaginateQuery<User>, options: PaginateOptions): Promise<PaginateResult<User>> {
    return this.userModel.paginate(query, options);
  }
}
