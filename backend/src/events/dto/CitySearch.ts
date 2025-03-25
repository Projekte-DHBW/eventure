import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CitySearchDto {
  @ApiProperty({ description: 'Search query for city names', minLength: 2 })
  @IsString()
  @MinLength(2)
  query: string;

  @ApiProperty({
    description: 'Maximum number of results to return',
    required: false,
    default: 10,
  })
  @IsOptional()
  limit = 10;
}
