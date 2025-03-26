import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Event } from './Event';
import { EventLocation } from './EventLocation';
import { EventAttendee } from './EventAttendee';

@Entity()
export class EventOccurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.occurrences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ name: 'eventId' })
  eventId: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate?: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  isOnline?: boolean;

  @Column({ nullable: true })
  meetingLink?: string;

  @ManyToOne(() => EventLocation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  locationDetails?: EventLocation;

  @Column({ name: 'locationId', nullable: true })
  locationId?: string;

  @Column({ nullable: true })
  maxParticipants?: number;

  @OneToMany(() => EventAttendee, (attendee) => attendee.occurrence)
  attendees?: EventAttendee[];
}
