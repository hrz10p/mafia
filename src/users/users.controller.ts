import { Controller, Param, Get, Body, Delete, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserSearchResultDto, GetAllPlayersQueryDto, GetAllPlayersResponseDto } from './dto';

@ApiTags('Users - Управление пользователями')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ 
    summary: 'Получить всех игроков',
    description: 'Возвращает список всех игроков с пагинацией, фильтрацией и сортировкой'
  })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: 'Номер страницы', default: 1 })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Количество элементов на странице', default: 10 })
  @ApiQuery({ name: 'search', type: 'string', required: false, description: 'Поиск по никнейму (частичное совпадение)' })
  @ApiQuery({ name: 'role', enum: ['player', 'judge', 'club_admin', 'club_owner', 'admin'], required: false, description: 'Фильтр по роли' })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false, description: 'Поле для сортировки', default: 'nickname' })
  @ApiQuery({ name: 'sortOrder', enum: ['ASC', 'DESC'], required: false, description: 'Порядок сортировки', default: 'ASC' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список игроков успешно получен',
    type: GetAllPlayersResponseDto
  })
  @ApiResponse({ status: 400, description: 'Некорректные параметры запроса' })
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllPlayers(@Query() query: GetAllPlayersQueryDto): Promise<GetAllPlayersResponseDto> {
    return this.usersService.getAllPlayers(query);
  }

  @ApiOperation({ summary: 'Search users by email' })
  @ApiQuery({ name: 'email', type: 'string', description: 'Email to search for (partial match)' })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Maximum number of results', default: 10 })
  @ApiResponse({ status: 200, description: 'Search results', type: [UserSearchResultDto] })
  @Get('search/email')
  searchUsersByEmail(
    @Query('email') email: string,
    @Query('limit') limit?: number,
  ): Promise<UserSearchResultDto[]> {
    return this.usersService.searchUsersByEmail(email, limit);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':userId')
  getPortfolioByUserId(@Param('userId') userId: number) {
    return this.usersService.getUserById(userId);
  }
}
