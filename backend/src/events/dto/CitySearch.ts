import { IsOptional, IsString, MinLength } from 'class-validator';

export class CitySearchDto {
  @IsString()
  @MinLength(2)
  query: string;

  @IsOptional()
  limit: number = 10;
}
