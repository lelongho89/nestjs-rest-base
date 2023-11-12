/**
 * @file User DTO
 * @module module/user/dto
*/

import { IntersectionType } from '@nestjs/mapped-types'
import { KeywordQueryDTO } from '@app/models/query.model'
import { PaginateOptionWithHotSortDTO } from '@app/models/paginate.model'

export class UserPaginateQueryDTO extends IntersectionType(PaginateOptionWithHotSortDTO, KeywordQueryDTO) { }
