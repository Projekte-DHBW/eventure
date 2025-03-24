import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDate,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventOccurrenceDto } from './CreateEvent';

export class UpdateEventDto {
  @ApiProperty({ description: 'Title of the event', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Detailed description of the event',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Visibility setting of the event',
    enum: ['public', 'private', 'unlisted'],
    required: false,
  })
  @IsEnum(['public', 'private', 'unlisted'])
  @IsOptional()
  visibility?: 'public' | 'private' | 'unlisted';

  @ApiProperty({
    description: 'Category of the event',
    enum: ['music', 'sports', 'culture', 'other'],
    required: false,
  })
  @IsEnum(['music', 'sports', 'culture', 'other'])
  @IsOptional()
  category?: 'music' | 'sports' | 'culture' | 'other';

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

  @ApiProperty({ description: 'Simple location string', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Event date', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  eventDate?: Date;

  @ApiProperty({ description: 'Whether the event is online', required: false })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({
    description: 'Meeting link for online events',
    required: false,
  })
  @IsString()
  @IsOptional()
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
    description: 'List of occurrence IDs to remove',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  removeOccurrences?: string[];
}
