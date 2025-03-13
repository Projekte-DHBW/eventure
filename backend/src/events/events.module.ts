import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../entity/Event';
import { EventLocation } from '../entity/EventLocation';
import { EventOccurrence } from '../entity/EventOccurrence';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventLocation, EventOccurrence]),
    AuthModule,
    UsersModule,
    ConfigModule.forRoot(),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
