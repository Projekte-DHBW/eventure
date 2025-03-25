import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/entity/RefreshToken';
import { User } from 'src/entity/User';
import { AuthService } from 'src/auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { EventAttendee } from 'src/entity/EventAttendee';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, EventAttendee]),
    ConfigModule.forRoot(),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService],
  exports: [UsersService],
})
export class UsersModule {}
