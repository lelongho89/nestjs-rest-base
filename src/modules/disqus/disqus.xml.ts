/**
 * @file Disqus XML transform
 * @module module/disqus/xml
*/

import { Comment } from '@app/modules/comment/comment.model'
import { Article } from '@app/modules/article/article.model'

// DOC: https://help.disqus.com/en/articles/1717222-custom-xml-import-format

export interface XMLItemData {
  article: Article
  comments: Array<Comment>
}
