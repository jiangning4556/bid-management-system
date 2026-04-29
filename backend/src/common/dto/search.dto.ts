import { IsOptional, IsString, IsEnum, IsArray, IsInt, Min, IsDateString, IsNumber, Min as MinNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_EQUAL = 'greaterEqual',
  LESS_EQUAL = 'lessEqual',
  BETWEEN = 'between',
  IN = 'in',
}

export enum SearchLogic {
  AND = 'AND',
  OR = 'OR',
}

export class SearchCondition {
  @IsString()
  field: string;

  @IsEnum(SearchOperator)
  operator: SearchOperator;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  value2?: string; // For BETWEEN operator

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[]; // For IN operator
}

export class AdvancedSearchDto {
  @IsOptional()
  @IsEnum(SearchLogic)
  logic?: SearchLogic = SearchLogic.AND;

  @IsOptional()
  @IsArray()
  @Type(() => SearchCondition)
  conditions?: SearchCondition[];

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  dateField?: string = 'createdAt';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statuses?: string[];

  @IsOptional()
  @IsString()
  statusField?: string;
}

export interface SearchQuery {
  logic?: SearchLogic;
  conditions?: SearchCondition[];
  dateFrom?: Date;
  dateTo?: Date;
  dateField?: string;
  statuses?: string[];
  statusField?: string;
}
