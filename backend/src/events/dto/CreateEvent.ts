import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsDate,
  IsUrl,
  IsArray,
  ValidateNested,
  ValidateIf,
  IsUUID,
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventOccurrenceDto } from './UpdateEvent';

// DTO for creating event locations
export class EventLocationDto {
  @ApiProperty({ description: 'Street address of the event location' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City where the event takes place' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province where the event takes place' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Country where the event takes place' })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Postal code of the event location',
    required: false,
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({
    description: 'Latitude coordinate of the event location',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate of the event location',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

// DTO for event managers (by user ID)
export class EventManagerDto {
  @ApiProperty({ description: 'User ID of the event manager' })
  @IsUUID()
  userId: string;
}

// DTO for invitations
export class InvitationDto {
  @ApiProperty({ description: 'Email address of the invited user' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Optional message to include with the invitation',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  message?: string;
}

// Main CreateEventDto
export class CreateEventDto {
  @ApiProperty({ description: 'Title of the event' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of the event' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Visibility setting of the event',
    enum: ['public', 'private', 'unlisted'],
  })
  @IsEnum(['public', 'private', 'unlisted'])
  visibility: 'public' | 'private' | 'unlisted';

  @ApiProperty({
    description: 'Category of the event',
    enum: ['music', 'sports', 'culture', 'other'],
  })
  @IsEnum(['music', 'sports', 'culture', 'other'])
  category: 'music' | 'sports' | 'culture' | 'other';

  @ApiProperty({ description: 'URL of the event cover image', required: false })
  @IsString()
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Maximum number of participants allowed',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  @ApiProperty({
    description: 'Simple location string (for backward compatibility)',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Event date (for backward compatibility)',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  eventDate?: Date;

  @ApiProperty({
    description: 'Whether the event is online',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean = false;

  @ApiProperty({
    description: 'Meeting link for online events',
    required: false,
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.isOnline === true)
  meetingLink?: string;

  @ApiProperty({
    description: 'List of event occurrences',
    required: false,
    type: [EventOccurrenceDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventOccurrenceDto)
  occurrences?: EventOccurrenceDto[];

  @ApiProperty({
    description: 'List of event managers',
    required: false,
    type: [EventManagerDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventManagerDto)
  managers?: EventManagerDto[];

  @ApiProperty({
    description: 'List of invitations to send',
    required: false,
    type: [InvitationDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InvitationDto)
  invitations?: InvitationDto[];
}
