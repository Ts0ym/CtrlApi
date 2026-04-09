import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProjectDto {
  @IsInt()
  @Min(0)
  sortOrder: number;

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
