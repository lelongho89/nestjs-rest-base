import {
  Controller,
  Get,
  Param,
  Post,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Responser } from '@app/decorators/responser.decorator'
import { FileService } from './file.service';
import { FileEntity } from './file.model';
import MongooseClassSerializerInterceptor from '@app/interceptors/mongoose-class-serializer.interceptor';

@UseInterceptors(MongooseClassSerializerInterceptor(FileEntity))
@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Responser.handle('Upload file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    return this.fileService.uploadFile(file);
  }

  @Get(':path')
  download(@Param('path') path, @Response() response) {
    return response.sendFile(path, { root: './files' });
  }
}
