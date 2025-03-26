import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../../entity/Event';
import { EventOccurrence } from '../../entity/EventOccurrence';
import { EventManager } from '../../entity/EventManager';
import { Invitation } from '../../entity/Invitation';

export class EventResponseDto extends Event {
  @ApiProperty({ type: [EventOccurrence] })
  declare occurrences: EventOccurrence[];

  @ApiProperty({ type: [EventManager] })
  declare managers: EventManager[];

  @ApiProperty({ type: [Invitation] })
  declare invitations: Invitation[];

  @ApiProperty()
  attendeeCount: number;

  @ApiProperty()
  creatorName: string;
}
