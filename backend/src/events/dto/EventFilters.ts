import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class EventFiltersDto {
  @ApiProperty({
    description: 'Suchbegriff für die Eventsuche (Titel, Beschreibung)',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Event-Kategorien zur Filterung',
    enum: ['music', 'sports', 'culture', 'other'],
    required: false,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  types?: ('music' | 'sports' | 'culture' | 'other')[];

  @ApiProperty({
    description: 'Liste von Standorten zur Filterung',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  locations?: string[];

  @ApiProperty({
    description:
      'Datumsbereich oder spezifisches Datum zur Filterung (today, tomorrow, this_week, this_month, this_year oder YYYY-MM-DD)',
    required: false,
    example: 'tomorrow, this_week, 2025-04-15',
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiProperty({
    description: 'Sortierreihenfolge der Events',
    enum: ['newest', 'popular', 'upcoming'],
    required: false,
    default: 'newest',
  })
  @IsEnum(['newest', 'popular', 'upcoming'])
  @IsOptional()
  sort?: 'newest' | 'popular' | 'upcoming' = 'newest';

  @ApiProperty({
    description: 'Seitenzahl für die Paginierung',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiProperty({
    description: 'Anzahl der Events pro Seite',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 20)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Nur Events anzeigen, an denen der Benutzer teilnimmt',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  attending?: boolean;

  @ApiPropertyOptional({
    description:
      'Benutzer-ID für die Filterung nach Teilnahme (interne Verwendung)',
  })
  @ValidateIf((o) => o.attending === true)
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Kategorie für die Filterung (Alternative zu types)',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
