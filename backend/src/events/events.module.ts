import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../entity/Event';
import { EventLocation } from '../entity/EventLocation';
import { EventOccurrence } from '../entity/EventOccurrence';
import { EventAttendee } from '../entity/EventAttendee';
import { Invitation } from '../entity/Invitation';
import { User } from '../entity/User';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { InvitedUsers } from 'src/entity/InvitedUsers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventLocation,
      EventOccurrence,
      EventAttendee,
      Invitation,
      User,
      InvitedUsers,
    ]),
    AuthModule,
    UsersModule,
    ConfigModule.forRoot(),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
