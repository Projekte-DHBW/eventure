import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { Exclude } from 'class-transformer';

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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
}
