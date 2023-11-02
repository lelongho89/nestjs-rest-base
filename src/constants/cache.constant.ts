/**
 * @file Global cache constant
 * @module constant/cache
*/

export enum CacheKeys {
  Option = 'option',
  Archive = 'archive',
  AllTags = 'all-tags',
  TodayViewCount = 'today-view-count'
}

export const getDecoratorCacheKey = (key: string) => {
  return `decorator:${key}`
}

export const getDisqusCacheKey = (key: string) => {
  return `disqus:${key}`
}
