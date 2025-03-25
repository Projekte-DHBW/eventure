import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class EventFiltersDto {
  @ApiProperty({
    description: 'Search query to filter events',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Category to filter events by',
    enum: ['music', 'sports', 'culture', 'other'],
    required: false,
  })
  @IsEnum(['music', 'sports', 'culture', 'other'])
  @IsOptional()
  category?: 'music' | 'sports' | 'culture' | 'other';

  @ApiProperty({
    description: 'Sort order for events',
    enum: ['newest', 'popular', 'upcoming'],
    required: false,
    default: 'newest',
  })
  @IsEnum(['newest', 'popular', 'upcoming'])
  @IsOptional()
  sort?: 'newest' | 'popular' | 'upcoming' = 'newest';

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of events per page',
    required: false,
    default: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: 'Date to filter events by', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Locations to filter events by',
    required: false,
    type: [String],
  })
  @IsOptional()
  locations?: string | string[];

  @ApiProperty({
    description: 'Event types to filter by',
    required: false,
    type: [String],
  })
  @IsOptional()
  types?: string[];

  @ApiPropertyOptional({
    description: 'Filter for events the user is attending',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  attending?: boolean;

  @ApiPropertyOptional({
    description: 'User ID for filtering attended events (internal use)',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
