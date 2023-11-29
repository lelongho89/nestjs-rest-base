import { FilterQuery } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { MongooseModel, MongooseDoc } from '@app/interfaces/mongoose.interface';
import { InjectModel } from '@app/transformers/model.transformer';
import { PaginateResult, PaginateQuery, PaginateOptions } from '@app/utils/paginate';
import { User } from './user.model';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: MongooseModel<User>
  ) { }

  public async create(newUser: CreateUserDto): Promise<MongooseDoc<User>> {
    return this.userModel.create(newUser);
  }

  public async update(id: string, payload: UpdateUserDto): Promise<MongooseDoc<User>> {
    const user = await this.userModel.findByIdAndUpdate(id, payload, { new: true }).exec()
    if (!user) {
      throw `User '${id}' not found`
    }
    return user;
  }

  public async findAll(query: PaginateQuery<User>, options: PaginateOptions): Promise<PaginateResult<User>> {
    return this.userModel.paginate(query, options);
  }

  public async findOne(id: string): Promise<MongooseDoc<User>> {
    return this.userModel
      .findById(id)
      .exec()
      .then((result) => (result?.deleted_at ? null : result) || Promise.reject(`User '${id}' not found`));
  }

  public async findOneByCondition(filters: FilterQuery<User>) {
    return await this.userModel.findOne({ ...filters, deleted_at: null }).exec();
  }

  public async softDelete(id: string): Promise<boolean> {
    const deletedUser = await this.userModel.findById(id);
    if (!deletedUser) {
      return false;
    }
    return !!(await this.userModel.findByIdAndUpdate(id, { deleted_at: new Date() }).exec());
  }

  public async permanentlyDelete(id: string): Promise<boolean> {
    const deletedUser = await this.userModel.findById(id);
    if (!deletedUser) {
      return false;
    }
    return !!(await this.userModel.findOneAndDelete({ _id: id }));
  }

  /**
   * Set Current Refresh Token
   * @param id
   * @param hashed_token
   */
  public async setCurrentRefreshToken(id: string, hashed_token: string): Promise<void> {
    try {
      await this.userModel.findByIdAndUpdate(id, { refresh_token: hashed_token });
    } catch (error) {
      throw error;
    }
  }

  public async removeRefreshToken(id: string) {
    try {
      await this.userModel.findByIdAndUpdate(id, { refresh_token: null });
    } catch (error) {
      throw error;
    }
  }
}
