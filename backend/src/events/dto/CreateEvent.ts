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

// DTO for creating event locations
export class EventLocationDto {
  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

// DTO for creating event occurrences
export class EventOccurrenceDto {
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  // Each occurrence can have its own location
  @IsOptional()
  @ValidateNested()
  @Type(() => EventLocationDto)
  location?: EventLocationDto;
}

// DTO for event managers (by user ID)
export class EventManagerDto {
  @IsUUID()
  userId: string;
}

// DTO for invitations
export class InvitationDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  message?: string;
}

// Main CreateEventDto
export class CreateEventDto {
  // Basic event properties
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(['public', 'private', 'unlisted'])
  visibility: 'public' | 'private' | 'unlisted';

  @IsEnum(['music', 'sports', 'culture', 'other'])
  category: 'music' | 'sports' | 'culture' | 'other';

  @IsString()
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  // Simple event properties (for backward compatibility)
  @IsString()
  @IsOptional()
  location?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  eventDate?: Date;

  // Online event properties
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean = false;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.isOnline === true)
  meetingLink?: string;

  // Advanced event properties using related entities
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventOccurrenceDto)
  occurrences?: EventOccurrenceDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventManagerDto)
  managers?: EventManagerDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InvitationDto)
  invitations?: InvitationDto[];
}
