import { IsString, IsNumber, IsOptional, IsIn, IsDateString } from 'class-validator';
import { VITAL_TYPES, VITAL_SOURCES } from '../../common/constants';

export class CreateVitalDto {
  @IsString()
  @IsIn(VITAL_TYPES)
  type: (typeof VITAL_TYPES)[number];

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  valueSecondary?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @IsString()
  @IsIn(VITAL_SOURCES)
  source?: (typeof VITAL_SOURCES)[number];

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}