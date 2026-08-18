import { IsString, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetCount?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentCount?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
