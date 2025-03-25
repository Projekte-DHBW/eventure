import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Event } from './Event';
import { EventOccurrence } from './EventOccurrence';
import { User } from './User';

@Entity()
@Unique(['userId', 'eventId', 'occurrenceId'])
export class EventAttendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  userId: string;

  @ManyToOne(() => Event, (event) => event.attendees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Optional - for specific occurrence attendance
  @Column({ nullable: true })
  occurrenceId?: string;

  @ManyToOne(() => EventOccurrence, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'occurrenceId' })
  occurrence?: EventOccurrence;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'text', default: 'confirmed' })
  status: 'confirmed' | 'pending' | 'cancelled';

  // Track if this came from an invitation
  @Column({ nullable: true })
  invitationId?: string;
}
