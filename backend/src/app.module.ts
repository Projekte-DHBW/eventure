import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static'; // Add this import
import { join } from 'path';
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
import { OpenAiModule } from './openai/openai.model';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: path.join(__dirname, '..', 'database.db'),
      autoLoadEntities: true,
      autoSave: true,
      synchronize: true, // Set to false in production, use migrations instead
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // This will serve files under the /uploads URL path
      serveStaticOptions: {
        index: false, // Don't serve index.html for directory requests
        maxAge: 86400000, // Cache for 1 day (in milliseconds)
      },
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
    OpenAiModule,
    UploadsModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
