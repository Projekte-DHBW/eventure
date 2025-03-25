import { Entity, ManyToOne, Column, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Event } from './Event';
import { User } from './User';

@Entity()
export class Invitation extends BaseEntity {
  @ManyToOne(() => Event, (event) => event.invitations, { onDelete: 'CASCADE' })
  @JoinColumn()
  event: Event;

  @Column()
  eventId: string;

  // Optional - for registered users
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  invitedUser?: User;

  @Column({ nullable: true })
  invitedUserId?: string;

  // For non-registered users or as alternative contact
  @Column({ nullable: true })
  email?: string;

  @Column()
  invitedAt: Date;

  @Column({ nullable: true })
  message?: string;

  @Column({ type: 'text', default: 'pending' })
  status: 'pending' | 'accepted' | 'declined';

  @Column({ nullable: true })
  respondedAt?: Date;

  // If the invitation is for a specific occurrence rather than the whole event
  @Column({ nullable: true })
  occurrenceId?: string;
}
