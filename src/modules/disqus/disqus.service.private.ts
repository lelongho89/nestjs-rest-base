/**
 * @file Disqus private service
 * @module module/disqus/service
*/

import dayjs from 'dayjs'
import { XMLParser } from 'fast-xml-parser'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AllConfigType } from '@app/config/config.type'
import { ArticleService } from '@app/modules/article/article.service'
import { CommentService } from '@app/modules/comment/comment.service'
import { Comment } from '@app/modules/comment/comment.model'
import { Article } from '@app/modules/article/article.model'
import { GUESTBOOK_POST_ID, CommentState } from '@app/constants/biz.constant'
import { getExtendObject } from '@app/transformers/extend.transformer'
import { getPermalinkByID } from '@app/transformers/urlmap.transformer'
import { Disqus } from '@app/utils/disqus'
import logger from '@app/utils/logger'
import { GeneralDisqusParams } from './disqus.dto'
import { getThreadIdentifierByID } from './disqus.constant'
import { ThreadState } from './disqus.dto'
import { XMLItemData } from './disqus.xml'
import * as DISQUS_CONST from './disqus.constant'

const log = logger.scope('DisqusPrivateService')

@Injectable()
export class DisqusPrivateService {
  private disqus: Disqus

  constructor(
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.disqus = new Disqus({
      apiKey: this.configService.getOrThrow('disqus.publicKey', { infer: true }),
      apiSecret: this.configService.getOrThrow('disqus.secretKey', { infer: true })
    })
  }

  public async createThread(postID: number) {
    try {
      const article = await this.articleService.getDetailByNumberIDOrSlug({ idOrSlug: postID, publicOnly: true })
      // https://disqus.com/api/docs/threads/create/
      const response = await this.disqus.request('threads/create', {
        forum: this.configService.getOrThrow('disqus.forum', { infer: true }),
        identifier: DISQUS_CONST.getThreadIdentifierByID(postID),
        title: article.title,
        message: article.description,
        slug: article.slug || DISQUS_CONST.getThreadIdentifierByID(postID),
        date: dayjs(article.created_at).unix(),
        url: getPermalinkByID(postID),
        access_token: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true })
      })
      return response.response
    } catch (error) {
      log.warn('createThread failed!', postID, error)
      throw error
    }
  }

  public async getThreads(params: GeneralDisqusParams) {
    // https://disqus.com/api/docs/threads/list/
    return this.disqus
      .request('threads/list', {
        access_token: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true }),
        forum: this.configService.getOrThrow('disqus.forum', { infer: true }),
        ...params
      })
      .catch((error) => {
        log.warn('getThreads failed!', error)
        return Promise.reject(error)
      })
  }

  public async getPosts(params: GeneralDisqusParams) {
    // https://disqus.com/api/docs/posts/list/
    return this.disqus
      .request('posts/list', {
        access_token: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true }),
        forum: this.configService.getOrThrow('disqus.forum', { infer: true }),
        ...params
      })
      .catch((error) => {
        log.warn('getPosts failed!', error)
        return Promise.reject(error)
      })
  }

  public async updateThread(params: any) {
    // https://disqus.com/api/docs/threads/update/
    return this.disqus
      .request('threads/update', {
        access_token: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true }),
        ...params
      })
      .catch((error) => {
        log.warn('updateThread failed!', error)
        return Promise.reject(error)
      })
  }

  public async updatePost(params: any) {
    // https://disqus.com/api/docs/posts/update/
    return this.disqus
      .request('posts/update', {
        access_token: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true }),
        ...params
      })
      .catch((error) => {
        log.warn('updatePost failed!', error)
        return Promise.reject(error)
      })
  }

  public async approvePost(params: any) {
    // https://disqus.com/api/docs/posts/approve/
    return this.disqus
      .request('posts/approve', {
        access_token: this.configService.getOrThrow('disqus.adminAccessToken', { infer: true }),
        ...params
      })
      .catch((error) => {
        log.warn('approvePost failed!', error)
        return Promise.reject(error)
      })
  }

  // export NodePress to Disqus
  // https://help.disqus.com/en/articles/1717222-custom-xml-import-format
  public async exportXML(): Promise<string> {
    const treeMap = new Map<number, { comments: Array<Comment>; article: Article }>()
    const guestbook: Comment[] = []

    // 1. get comments
    const allComments = await this.commentService.getAll()
    const todoComments = allComments.filter((comment) =>
      [CommentState.Auditing, CommentState.Published].includes(comment.state)
    )
    const todoCommentIDs = todoComments.map((comment) => comment.id)
    todoComments.forEach((comment) => {
      if (comment.pid && !todoCommentIDs.includes(comment.pid)) {
        comment.pid = 0
      }
      if (comment.post_id === GUESTBOOK_POST_ID) {
        guestbook.push(comment)
      } else if (treeMap.has(comment.post_id)) {
        treeMap.get(comment.post_id)!.comments.push(comment)
      } else {
        treeMap.set(comment.post_id, { comments: [comment] } as any)
      }
    })

    // 2. map comment postIDs & get articles
    const articleIDs = Array.from(treeMap.keys())
    const articles = await this.articleService.getList(articleIDs)
    articles.forEach((article) => {
      if (treeMap.has(article.id)) {
        treeMap.get(article.id)!.article = article
      }
    })

    // 3. make XML data
    const treeList = Array.from(treeMap.values()).filter((item) => Boolean(item.article))
    return this.getDisqusXML(treeList, guestbook)
  }

  // import Disqus data to NodePress
  // https://help.disqus.com/en/articles/1717164-comments-export
  public async importXML(file: Express.Multer.File) {
    const xml = file.buffer.toString()
    const parser = new XMLParser({
      ignoreAttributes: false,
      allowBooleanAttributes: true,
      attributeNamePrefix: '@'
    })
    const object = parser.parse(xml)
    // const threads: any[] = object.disqus.thread
    const posts: any[] = object.disqus.post
    // filter new data
    const filtered = posts.filter((post) => Boolean(post.id))
    const getEach = (post: any) => ({
      commentID: Number(post.id.replace(`wp_id=`, '')),
      postID: post['@dsq:id'] as string,
      threadID: post.thread['@dsq:id'] as string,
      isAnonymous: post.author.isAnonymous as boolean,
      username: (post.author.username as string) || null
    })

    const doImport = async (each: ReturnType<typeof getEach>) => {
      if (!Number.isFinite(each.commentID)) {
        throw `Invalid comment ID '${each.commentID}'`
      }

      const comment = await this.commentService.getDetailByNumberID(each.commentID)
      if (!comment) {
        throw `Invalid comment '${comment}'`
      }

      const _extends = comment.extends || []
      const extendsObject = getExtendObject(_extends)
      // post ID
      if (!extendsObject[DISQUS_CONST.COMMENT_POST_ID_EXTEND_KEY]) {
        _extends.push({ name: DISQUS_CONST.COMMENT_POST_ID_EXTEND_KEY, value: each.postID })
      }
      // thread ID
      if (!extendsObject[DISQUS_CONST.COMMENT_THREAD_ID_EXTEND_KEY]) {
        _extends.push({ name: DISQUS_CONST.COMMENT_THREAD_ID_EXTEND_KEY, value: each.threadID })
      }
      // guest(anonymous) | disqus user
      if (each.isAnonymous) {
        if (!extendsObject[DISQUS_CONST.COMMENT_ANONYMOUS_EXTEND_KEY]) {
          _extends.push({ name: DISQUS_CONST.COMMENT_ANONYMOUS_EXTEND_KEY, value: 'true' })
        }
      } else if (each.username) {
        if (!extendsObject[DISQUS_CONST.COMMENT_AUTHOR_USERNAME_EXTEND_KEY]) {
          _extends.push({ name: DISQUS_CONST.COMMENT_AUTHOR_USERNAME_EXTEND_KEY, value: each.username })
        }
      }
      comment.extends = _extends
      return await comment.save()
    }

    const done: any[] = []
    const fail: any[] = []
    for (const post of filtered) {
      const each = getEach(post)
      try {
        await doImport(each)
        done.push(each)
      } catch (error) {
        fail.push(each)
      }
    }

    log.info('import XML', { done: done.length, fail: fail.length })
    return { done, fail }
  }

  private getDisqusXML(data: XMLItemData[], guestbook: Array<Comment>) {
    const getCommentItemXML = (comment: Comment) => {
      return `
        <wp:comment>
          <wp:comment_id>${comment.id}</wp:comment_id>
          <wp:comment_parent>${comment.pid || ''}</wp:comment_parent>
          <wp:comment_author>${comment.author.name || ''}</wp:comment_author>
          <wp:comment_author_email>${comment.author.email || ''}</wp:comment_author_email>
          <wp:comment_author_url>${comment.author.site || ''}</wp:comment_author_url>
          <wp:comment_author_IP>${comment.ip || ''}</wp:comment_author_IP>
          <wp:comment_date_gmt>${dayjs(comment.created_at).format('YYYY-MM-DD HH:mm:ss')}</wp:comment_date_gmt>
          <wp:comment_content><![CDATA[${comment.content || ''}]]></wp:comment_content>
          <wp:comment_approved>${comment.state === CommentState.Published ? 1 : 0}</wp:comment_approved>
        </wp:comment>
      `
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0"
        xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:dsq="http://www.disqus.com/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:wp="http://wordpress.org/export/1.0/"
      >
        <channel>
          <item>
            <title>Guestbook</title>
            <link>${getPermalinkByID(GUESTBOOK_POST_ID)}</link>
            <content:encoded><![CDATA[${this.configService.getOrThrow('app.name', { infer: true })}]]></content:encoded>
            <dsq:thread_identifier>${getThreadIdentifierByID(GUESTBOOK_POST_ID)}</dsq:thread_identifier>
            <wp:post_date_gmt>2017-01-01 00:00:00</wp:post_date_gmt>
            <wp:comment_status>open</wp:comment_status>
            ${guestbook.map(getCommentItemXML).join('\n')}
          </item>
          ${data
        .map(
          (item) => `
              <item>
                <title>${item.article.title}</title>
                <link>${getPermalinkByID(item.article.id)}</link>
                <content:encoded><![CDATA[${item.article.description || ''}]]></content:encoded>
                <dsq:thread_identifier>${getThreadIdentifierByID(item.article.id)}</dsq:thread_identifier>
                <wp:post_date_gmt>${dayjs(item.article.created_at).format('YYYY-MM-DD HH:mm:ss')}</wp:post_date_gmt>
                <wp:comment_status>${item.article.disabled_comments ? ThreadState.Closed : ThreadState.Open
            }</wp:comment_status>
                ${item.comments.map(getCommentItemXML).join('\n')}
              </item>
            `
        )
        .join('\n')}
        </channel>
      </rss>`
  }
}
