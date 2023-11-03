/**
 * @file Archive controller
 * @module module/archive/controller
*/

import { UseGuards, Controller, Get, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminOnlyGuard } from '@app/guards/admin-only.guard'
import { Responser } from '@app/decorators/responser.decorator'
import { ArchiveService, ArchiveData } from './archive.service'

@ApiBearerAuth()
@ApiTags('Archive')
@Controller('archive')
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @Get()
  @Responser.handle('Get archive')
  getArchive(): Promise<ArchiveData> {
    return this.archiveService.getCache()
  }

  @Patch()
  @UseGuards(AdminOnlyGuard)
  @Responser.handle('Update archive cache')
  updateArchive(): Promise<any> {
    return this.archiveService.updateCache()
  }
}
