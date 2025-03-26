import {
  Entity,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Exclude } from 'class-transformer';
import { EventOccurrence } from './EventOccurrence';
import { EventAttendee } from './EventAttendee';
import { Invitation } from './Invitation';
import { InvitedUsers } from './InvitedUsers';

@Entity()
export class Event extends BaseEntity {
  @Column({ nullable: false })
  @Index()
  title: string;

  @Column('text', { nullable: false })
  description: string;

  // The relation object - exclude from responses
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'creator' })
  @Exclude()
  creatorObj: User;

  // Add an explicit column for the creator ID that will be included in responses
  @Column({ nullable: false })
  creator: string;

  @Column({ type: 'text', nullable: false })
  visibility: 'public' | 'private' | 'unlisted';

  @Column({ type: 'text', nullable: false })
  @Index()
  category: 'music' | 'sports' | 'culture' | 'other';

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column({ nullable: true })
  maxParticipants?: number;

  @Column({ nullable: true })
  @Index()
  eventDate?: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  meetingLink?: string;

  // Flag to indicate if the event is recurring (has multiple occurrences)
  @Column({ default: false })
  isRecurring: boolean;

  @OneToMany(() => EventOccurrence, (occurrence) => occurrence.event)
  occurrences: EventOccurrence[];

  @OneToMany(() => EventAttendee, (attendee) => attendee.event)
  attendees: EventAttendee[];

  @OneToMany(() => Invitation, (invitation) => invitation.event)
  invitations: Invitation[];

  @OneToMany(() => InvitedUsers, (invitedUser) => invitedUser.event)
  invitedUsers: InvitedUsers[];
}
