import { Controller, Param, Get, Body, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  getPortfolioByUserId(@Param('userId') userId: number) {
    return this.usersService.getUserById(userId);
  }

}
