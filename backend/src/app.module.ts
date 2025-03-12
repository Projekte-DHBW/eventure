import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { Invitation } from './entity/Invitation';
import { Notification } from './entity/Notification';
import { Ticket } from './entity/Ticket';
import { Registration } from './entity/Registration';
import { EventOccurrence } from './entity/EventOccurrence';
import { EventLocation } from './entity/EventLocation';
import { InvitedUsers } from './entity/InvitedUsers';
import { EventManager } from './entity/EventManager';
import { Event } from './entity/Event';
import { User } from './entity/User';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import * as path from 'path';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: path.join(__dirname, '..', 'database.db'),
      autoLoadEntities: true,
      autoSave: true,
      synchronize: true, // Set to false in production, use migrations instead
    }),
    TypeOrmModule.forFeature([
      User,
      Event,
      EventManager,
      InvitedUsers,
      EventLocation,
      EventOccurrence,
      Registration,
      Ticket,
      Notification,
      Invitation,
    ]),
    AuthModule,
    UsersModule,
    EventsModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
