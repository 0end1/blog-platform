import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MaxLength(30)
  name: string;

  @IsString()
  @MaxLength(40)
  slug: string;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  slug?: string;
}
