import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@app/config/config.type';
import { InjectModel } from '@app/transformers/model.transformer';
import { MongooseModel, MongooseDoc } from '@app/interfaces/mongoose.interface';
import { FileEntity } from './file.model';


@Injectable()
export class FileService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @InjectModel(FileEntity) private readonly fileModel: MongooseModel<FileEntity>,
  ) { }

  async uploadFile(
    file: Express.Multer.File | Express.MulterS3.File,
  ): Promise<MongooseDoc<FileEntity>> {
    if (!file) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'selectFile',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const path = {
      local: `/${this.configService.get('app.apiPrefix', { infer: true })}/v1/${file.path.replace(/\\/g, "/")}`,
      s3: (file as Express.MulterS3.File).location,
    };

    return this.fileModel.create({
      path: path[this.configService.getOrThrow('file.driver', { infer: true })],
    });
  }

  async getById(id: string): Promise<MongooseDoc<FileEntity>> {
    return this.fileModel.findById(id).exec().then(result => result || Promise.reject('File not found'));
  }
}
