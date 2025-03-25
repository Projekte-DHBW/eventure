import { Entity, ManyToOne, Column, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Event } from './Event';
import { Invitation } from './Invitation';

@Entity()
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column('text')
  message: string;

  @Column({ type: 'text' })
  type:
    | 'invitation'
    | 'event_update'
    | 'reminder'
    | 'event_cancelled'
    | 'occurrence_cancelled'
    | 'general';

  @Column({ default: false })
  isRead: boolean;

  // Connect notifications to relevant entities
  @Column({ nullable: true })
  eventId?: string;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column({ nullable: true })
  invitationId?: string;

  @ManyToOne(() => Invitation, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitationId' })
  invitation?: Invitation;

  @Column({ nullable: true })
  occurrenceId?: string;
}
