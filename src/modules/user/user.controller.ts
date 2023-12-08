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
  Request
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@app/decorators/roles.decorator';
import { RoleEnum } from '@app/constants/biz.constant';
import { RolesGuard } from '@app/guards/roles.guard';
import { ExposePipe } from '@app/pipes/expose.pipe'
import { Responser } from '@app/decorators/responser.decorator'
import { QueryParams, QueryParamsResult } from '@app/decorators/queryparams.decorator'
import { PaginateResult, PaginateQuery, PaginateOptions } from '@app/utils/paginate'
import { User } from './user.model';
import { UserPaginateQueryDTO, CreateUserDto, UpdateUserDto } from './user.dto';
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProfileDto: CreateUserDto): Promise<User> {
    return this.userService.create(createProfileDto);
  }

  @Get()
  @Responser.handle({ message: 'Get users', usePaginate: true, serialization: User })
  async findAll(
    @Request() req,
    @Query(ExposePipe) query: UserPaginateQueryDTO
  ): Promise<PaginateResult<User>> {
    const { page, per_page, sort, ...filters } = query
    const paginateQuery: PaginateQuery<User> = {}
    const paginateOptions: PaginateOptions = { page, perPage: per_page, sort }

    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword)
      const keywordRegExp = new RegExp(trimmed, 'i')
      paginateQuery.$or = [{ first_name: keywordRegExp }, { last_name: keywordRegExp }, { email: keywordRegExp }]
    }

    // paginate
    return this.userService.findAll(paginateQuery, paginateOptions)
  }

  @Get(':id')
  @Responser.handle({ message: 'Get user detail', error: HttpStatus.NOT_FOUND })
  getUser(@QueryParams() { params }: QueryParamsResult): Promise<User> {
    return this.userService.findOne(params.id).then((user) => {
      return user ? user : Promise.reject('User not found');
    });
  }

  @Put(':id')
  @Responser.handle('Update user')
  putUser(@QueryParams() { params }: QueryParamsResult, @Body() updateProfileDto: UpdateUserDto): Promise<User> {
    return this.userService.update(params.id, updateProfileDto);
  }

  @Delete(':id')
  @Responser.handle('Delete user')
  delUser(@QueryParams() { params }: QueryParamsResult): Promise<boolean> {
    return this.userService.softDelete(params.id);
  }
}
