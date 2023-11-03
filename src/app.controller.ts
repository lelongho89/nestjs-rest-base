/**
 * @file App controller
 * @module app/controller
*/

import { Get, Controller } from '@nestjs/common'
import * as APP_CONFIG from './app.config'

@Controller()
export class AppController {
  @Get('/ping')
  root(): any {
    return APP_CONFIG.PROJECT
  }
}
