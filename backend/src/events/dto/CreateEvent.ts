import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
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
  coverImageUrl?: string;

  @IsNumber()
  @IsOptional()
  maxParticipants?: number;
}
