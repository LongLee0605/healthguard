import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateMedicationDto {
  @IsString()
  medicationName: string;

  @IsString()
  dosage: string;

  @IsString()
  schedule: string;
}

export class UpdateMedicationDto {
  @IsOptional()
  @IsString()
  medicationName?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class LogMedicationDto {
  @IsString()
  scheduledTime: string;

  @IsString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  status: 'TAKEN' | 'MISSED';
}
