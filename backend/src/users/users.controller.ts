import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/jwtData.decorator';
import { User } from '../entity/User';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UserProfileDto } from './dto/user-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({
    status: 200,
    description: 'List of matching users',
    type: [User],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['email', 'name'],
    default: 'email',
    description: 'Search type',
  })
  @UseGuards(AuthGuard)
  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @Query('type') type: 'email' | 'name' = 'email',
    @GetUser() currentUser: User,
  ) {
    return this.usersService.searchUsers(query, type, currentUser.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite user by email' })
  @ApiResponse({ status: 200, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile information',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string) {
    const profile = await this.usersService.getUserProfile(id);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }
}
