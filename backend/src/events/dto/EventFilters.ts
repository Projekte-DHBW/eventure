import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class EventFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(['music', 'sports', 'culture', 'other'])
  @IsOptional()
  category?: 'music' | 'sports' | 'culture' | 'other';

  @IsEnum(['newest', 'popular', 'upcoming'])
  @IsOptional()
  sort?: 'newest' | 'popular' | 'upcoming' = 'newest';

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  locations?: string | string[];

  @IsOptional()
  types?: string[];
}
