import { ArrayNotEmpty, ArrayUnique, IsInt } from 'class-validator';

export class ReorderProjectsDto {
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  ids: number[];
}
