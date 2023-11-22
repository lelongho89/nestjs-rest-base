import lodash from 'lodash'
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@app/decorators/roles.decorator';
import { RoleEnum } from '@app/constants/biz.constant';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/guards/roles.guard';
import { ExposePipe } from '@app/pipes/expose.pipe'
import { Responser } from '@app/decorators/responser.decorator'
import { QueryParams, QueryParamsResult } from '@app/decorators/queryparams.decorator'
import { PaginateResult, PaginateQuery, PaginateOptions } from '@app/utils/paginate'
import { User } from './user.model';
import { UserPaginateQueryDTO } from './user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@app/modules/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@Roles(RoleEnum.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) { }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @Responser.paginate()
  @Responser.handle('Get users')
  async findAll(
    @Query(ExposePipe) query: UserPaginateQueryDTO
  ): Promise<PaginateResult<User>> {
    const { page, per_page, sort, ...filters } = query
    const paginateQuery: PaginateQuery<User> = {}
    const paginateOptions: PaginateOptions = { page, perPage: per_page }

    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword)
      const keywordRegExp = new RegExp(trimmed, 'i')
      paginateQuery.$or = [{ first_name: keywordRegExp }, { last_name: keywordRegExp }, { email: keywordRegExp }]
    }

    // paginate
    return this.userService.paginator(paginateQuery, paginateOptions)

  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @Responser.handle({ message: 'Get user detail', error: HttpStatus.NOT_FOUND })
  getUser(@QueryParams() { params }: QueryParamsResult): Promise<User> {
    return this.userService.getById(params.id).then((user) => {
      return user ? user : Promise.reject('User not found');
    });
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Put(':id')
  @Responser.handle('Update user')
  putUser(@QueryParams() { params }: QueryParamsResult, @Body() user: User): Promise<User> {
    return this.userService.update(params.id, user);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Delete(':id')
  @Responser.handle('Delete user')
  delUser(@QueryParams() { params }: QueryParamsResult): Promise<Boolean> {
    return this.userService.softDelete(params.id);
  }
}
