/**
 * @file Business constants & interfaces
 * @module constants/biz
*/

// language: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
export enum Language {
  English = 'en',
  Vietnam = 'vi',
  Mixed = 'mix'
}

// sort
export enum SortType {
  Asc = 1,
  Desc = -1,
  Hottest = 2
}

// publish state
export enum PublishState {
  Draft = 0,
  Published = 1,
  Recycle = -1
}

// public state
export enum PublicState {
  Public = 1,
  Secret = -1,
  Reserve = 0
}

// origin state
export enum OriginState {
  Original = 0,
  Reprint = 1,
  Hybrid = 2
}

// comment state
export enum CommentState {
  Auditing = 0,
  Published = 1,
  Deleted = -1,
  Spam = -2
}

export const GUESTBOOK_POST_ID = 0
export const ROOT_COMMENT_PID = 0
export const ROOT_FEEDBACK_TID = 0
