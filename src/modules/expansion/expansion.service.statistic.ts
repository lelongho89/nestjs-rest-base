/**
 * @file Expansion statistic service
 * @module module/expansion/statistic.service
*/

import schedule from 'node-schedule'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CacheService } from '@app/processors/cache/cache.service'
import { MailService } from '@app/modules/mail/mail.service'
import { ArticleService } from '@app/modules/article/article.service'
import { CommentService } from '@app/modules/comment/comment.service'
import { FeedbackService } from '@app/modules/feedback/feedback.service'
import { TagService } from '@app/modules/tag/tag.service'
import { AllConfigType } from '@app/config/config.type'
import { getTodayViewsCount, resetTodayViewsCount } from './expansion.helper'
import logger from '@app/utils/logger'

const log = logger.scope('StatisticService')

const DEFAULT_STATISTIC = Object.freeze({
  tags: null,
  articles: null,
  comments: null,
  totalViews: null,
  totalLikes: null,
  todayViews: null,
  averageEmotion: null
})

export type Statistic = Record<keyof typeof DEFAULT_STATISTIC, number | null>

@Injectable()
export class StatisticService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly mailService: MailService,
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
    private readonly feedbackService: FeedbackService,
    private readonly tagService: TagService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    // daily data cleaning at 00:01
    schedule.scheduleJob('1 0 0 * * *', async () => {
      try {
        const todayViewsCount = await getTodayViewsCount(this.cacheService)
        await this.dailyStatisticsTask(todayViewsCount)
      } finally {
        resetTodayViewsCount(this.cacheService).catch((error) => {
          log.warn('reset TODAY_VIEWS failed!', error)
        })
      }
    })
  }

  private async dailyStatisticsTask(todayViews: number) {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const todayNewComments = await this.commentService.countDocuments({
      created_at: { $gte: oneDayAgo, $lt: now }
    })

    await this.mailService.dailyStatistics({
      to: this.configService.getOrThrow('app.adminEmail', { infer: true }),
      data: { todayViews, todayNewComments }
    });
  }

  public getStatistic(publicOnly: boolean) {
    const resultData: Statistic = { ...DEFAULT_STATISTIC }
    const tasks = Promise.all([
      this.tagService.getTotalCount().then((value) => {
        resultData.tags = value
      }),
      this.articleService.getTotalCount(publicOnly).then((value) => {
        resultData.articles = value
      }),
      this.commentService.getTotalCount(publicOnly).then((value) => {
        resultData.comments = value
      }),
      this.feedbackService.getRootFeedbackAverageEmotion().then((value) => {
        resultData.averageEmotion = value ?? 0
      }),
      this.articleService.getMetaStatistic().then((value) => {
        resultData.totalViews = value?.totalViews ?? 0
        resultData.totalLikes = value?.totalLikes ?? 0
      }),
      getTodayViewsCount(this.cacheService).then((value) => {
        resultData.todayViews = value
      })
    ])

    return tasks
      .then(() => resultData)
      .catch((error) => {
        log.warn('getStatistic task partial failed!', error)
        return Promise.resolve(resultData)
      })
  }
}
