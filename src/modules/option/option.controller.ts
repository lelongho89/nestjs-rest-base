/**
 * @file Option controller
 * @module module/option/controller
*/

import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryParams, QueryParamsResult } from '@app/decorators/queryparams.decorator'
import { Responser } from '@app/decorators/responser.decorator'
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';
import { OptionService } from './option.service'
import { Option } from './option.model'

@ApiBearerAuth()
@ApiTags('Options')
@UseGuards(JwtAuthGuard)
@Controller('option')
export class OptionController {
  constructor(private readonly optionService: OptionService) { }

  @Get()
  @Responser.handle('Get site options')
  getOption(@QueryParams() { isAuthenticated }: QueryParamsResult) {
    return isAuthenticated ? this.optionService.ensureAppOption() : this.optionService.getOptionCacheForGuest()
  }

  @Put()
  @Responser.handle('Update site options')
  putOption(@Body() option: Option): Promise<Option> {
    return this.optionService.putOption(option)
  }
}
