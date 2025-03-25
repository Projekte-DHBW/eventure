import { ApiProperty } from '@nestjs/swagger';

export class UserEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  coverImageUrl?: string;

  @ApiProperty()
  category: string;
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  profilePictureUrl?: string;

  @ApiProperty()
  joinedDate: Date;

  @ApiProperty({ type: [UserEventDto] })
  pastEvents: UserEventDto[];

  @ApiProperty({ type: [UserEventDto] })
  upcomingEvents: UserEventDto[];
}
