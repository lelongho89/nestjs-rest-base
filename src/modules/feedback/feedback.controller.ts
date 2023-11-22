/**
 * @file Feedback controller
 * @module module/feedback/controller
*/

import lodash from 'lodash'
import { Controller, Get, Put, Post, Delete, Query, Body, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { AdminOnlyGuard } from '@app/guards/admin-only.guard'
import { ExposePipe } from '@app/pipes/expose.pipe'
import { Responser } from '@app/decorators/responser.decorator'
import { QueryParams, QueryParamsResult } from '@app/decorators/queryparams.decorator'
import { PaginateResult, PaginateQuery, PaginateOptions } from '@app/utils/paginate'
import { numberToBoolean } from '@app/transformers/value.transformer'
import { MailService } from '@app/modules/mail/mail.service'
import { AllConfigType } from '@app/config/config.type';
import { FeedbackPaginateQueryDTO, FeedbacksDTO } from './feedback.dto'
import { Feedback, FeedbackBase } from './feedback.model'
import { FeedbackService } from './feedback.service'

@ApiBearerAuth()
@ApiTags('Feedbacks')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService<AllConfigType>,
  ) { }

  @Get()
  @UseGuards(AdminOnlyGuard)
  @Responser.paginate()
  @Responser.handle('Get feedbacks')
  getFeedbacks(@Query(ExposePipe) query: FeedbackPaginateQueryDTO): Promise<PaginateResult<Feedback>> {
    const { sort, page, per_page, ...filters } = query
    const paginateQuery: PaginateQuery<Feedback> = {}
    const paginateOptions: PaginateOptions = { page, perPage: per_page, dateSort: sort }
    // target ID
    if (!lodash.isUndefined(filters.tid)) {
      paginateQuery.tid = filters.tid
    }
    // emotion
    if (!lodash.isUndefined(filters.emotion)) {
      paginateQuery.emotion = filters.emotion
    }
    // marked
    if (!lodash.isUndefined(filters.marked)) {
      paginateQuery.marked = numberToBoolean(filters.marked)
    }
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword)
      const keywordRegExp = new RegExp(trimmed, 'i')
      paginateQuery.$or = [
        { content: keywordRegExp },
        { user_name: keywordRegExp },
        { user_email: keywordRegExp },
        { remark: keywordRegExp }
      ]
    }

    return this.feedbackService.paginator(paginateQuery, paginateOptions)
  }

  @Post()
  @Throttle({ default: { ttl: seconds(30), limit: 3 } })
  @Responser.handle('Create feedback')
  async createFeedback(
    @Body() feedback: FeedbackBase,
    @QueryParams() { visitor }: QueryParamsResult
  ): Promise<Feedback> {
    const result = await this.feedbackService.create(feedback, visitor);
    await this.mailService.newFeedback({
      to: this.configService.getOrThrow('app.adminEmail', { infer: true }),
      data: { feedback: result }
    });

    return result
  }

  @Delete()
  @UseGuards(AdminOnlyGuard)
  @Responser.handle('Delete feedbacks')
  deleteFeedbacks(@Body() body: FeedbacksDTO) {
    return this.feedbackService.batchDelete(body.feedback_ids)
  }

  @Put(':id')
  @UseGuards(AdminOnlyGuard)
  @Responser.handle('Update feedback')
  putFeedback(@QueryParams() { params }: QueryParamsResult, @Body() feedback: Feedback): Promise<Feedback> {
    return this.feedbackService.update(params.id, feedback)
  }

  @Delete(':id')
  @UseGuards(AdminOnlyGuard)
  @Responser.handle('Delete feedback')
  deleteFeedback(@QueryParams() { params }: QueryParamsResult) {
    return this.feedbackService.delete(params.id)
  }
}
