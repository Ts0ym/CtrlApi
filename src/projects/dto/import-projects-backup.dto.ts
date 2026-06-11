import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ImportProjectDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  id?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  imageSrc: string;

  @IsString()
  videoEmbedCode: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ImportProjectsBackupDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsInt()
  @Min(1)
  version: number;

  @IsString()
  @IsNotEmpty()
  exportedAt: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportProjectDto)
  projects: ImportProjectDto[];
}
