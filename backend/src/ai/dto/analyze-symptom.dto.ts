import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class AnalyzeSymptomDto {
  @IsOptional()
  @IsString()
  symptomLogId?: string;

  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  @Max(10)
  severity: number;

  @IsOptional()
  @IsString()
  bodyPart?: string;
}
