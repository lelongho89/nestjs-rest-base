import { FilterQuery } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { MongooseDoc, MongooseModel } from '@app/interfaces/mongoose.interface';
import { InjectModel } from '@app/transformers/model.transformer';
import { Forgot } from './forgot.model';

@Injectable()
export class ForgotService {
  constructor(
    @InjectModel(Forgot) private readonly forgotModel: MongooseModel<Forgot>,
  ) { }

  async findOne(filters: FilterQuery<Forgot>): Promise<MongooseDoc<Forgot>> {
    return this.forgotModel.findOne({ ...filters, deleted_at: null }).exec().then((result) => result || Promise.reject(`Forgot not found`));
  }

  async findAll(filters: FilterQuery<Forgot>): Promise<Forgot[]> {
    return this.forgotModel.find({ ...filters, deleted_at: null }).exec().then((result) => result || []);
  }

  async create(forgot: Forgot): Promise<MongooseDoc<Forgot>> {
    return this.forgotModel.create(forgot);
  }

  async delete(id: string): Promise<boolean> {
    const forgot = await this.forgotModel.findById(id);
    if (!forgot) {
      return false;
    }
    return !!(await this.forgotModel.findByIdAndUpdate(id, { deleted_at: new Date() }).exec());
  }
}
