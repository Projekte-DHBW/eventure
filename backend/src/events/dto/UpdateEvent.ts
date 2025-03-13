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
import { EventOccurrenceDto } from './CreateEvent';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['public', 'private', 'unlisted'])
  @IsOptional()
  visibility?: 'public' | 'private' | 'unlisted';

  @IsEnum(['music', 'sports', 'culture', 'other'])
  @IsOptional()
  category?: 'music' | 'sports' | 'culture' | 'other';

  @IsString()
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  eventDate?: Date;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventOccurrenceDto)
  occurrences?: EventOccurrenceDto[];

  // Specify occurrences to remove (by ID)
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  removeOccurrences?: string[];
}
