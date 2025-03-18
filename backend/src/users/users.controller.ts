import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/jwtData.decorator';
import { User } from '../entity/User';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @Query('type') type: 'email' | 'name' = 'email',
    @GetUser() currentUser: User,
  ) {
    return this.usersService.searchUsers(query, type, currentUser.id);
  }

  @UseGuards(AuthGuard)
  @Post('invite')
  async inviteByEmail(
    @Body() body: { email: string; eventId?: string; message?: string },
    @GetUser() currentUser: User,
  ) {
    return this.usersService.inviteByEmail(
      body.email,
      currentUser.id,
      body.eventId,
      body.message,
    );
  }

}
