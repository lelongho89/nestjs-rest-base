/**
 * @file App controller
 * @module app/controller
*/

import { Get, Controller } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AllConfigType } from '@app/config/config.type'

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
  ) { }

  @Get('/ping')
  root(): any {
    return this.configService.getOrThrow('project');
  }
}
