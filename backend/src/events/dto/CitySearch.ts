import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CitySearchDto {
  @ApiProperty({
    description: 'Suchbegriff für Städtenamen',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, {
    message: 'Der Suchbegriff muss mindestens 2 Zeichen lang sein',
  })
  query: string;

  @ApiProperty({
    description: 'Maximale Anzahl der zurückzugebenden Städte',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}
