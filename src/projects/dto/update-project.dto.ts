import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  imageSrc?: string;

  @IsOptional()
  @IsString()
  videoEmbedCode?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}
