import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Copos' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: 'Categoria para copos descartaveis e termicos.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}
