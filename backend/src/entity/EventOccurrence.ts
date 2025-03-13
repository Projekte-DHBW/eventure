import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Event } from './Event';
import { EventLocation } from './EventLocation';

@Entity()
export class EventOccurrence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ name: 'eventId' })
  eventId: string;

  // Change from timestamp to datetime (which SQLite supports)
  @Column({ type: 'datetime' })
  startDate: Date;

  // Change from timestamp to datetime (which SQLite supports)
  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @ManyToOne(() => EventLocation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  location: EventLocation | null;

  @Column({ name: 'locationId', nullable: true })
  locationId: string | null;
}
