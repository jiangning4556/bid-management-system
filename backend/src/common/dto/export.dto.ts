import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportFieldDto {
  @ApiProperty({ description: 'Field key in the data object' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Display label for the column header' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'Column width' })
  @IsOptional()
  width?: number;
}

export class ExportDto {
  @ApiPropertyOptional({ description: 'Fields to include in export', type: [ExportFieldDto] })
  @IsArray()
  @IsOptional()
  fields?: ExportFieldDto[];

  @ApiPropertyOptional({ description: 'Filter by IDs' })
  @IsArray()
  @IsOptional()
  ids?: string[];
}
