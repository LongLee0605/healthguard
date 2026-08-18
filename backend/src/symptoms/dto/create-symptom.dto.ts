import { IsString, IsInt, Min, Max, IsOptional, IsDateString } from 'class-validator';

export class CreateSymptomDto {
  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  @Max(10)
  severity: number;

  @IsOptional()
  @IsString()
  bodyPart?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
