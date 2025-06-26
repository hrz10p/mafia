import { Controller, Param, Get, Body, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserSearchResultDto } from './dto';

@ApiTags('Users - Управление пользователями')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':userId')
  getPortfolioByUserId(@Param('userId') userId: number) {
    return this.usersService.getUserById(userId);
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
}
