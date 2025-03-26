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

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  invitedUser?: User;

  @Column({ nullable: true })
  invitedUserId?: string;

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

  @Column({ nullable: true })
  occurrenceId?: string;
}
