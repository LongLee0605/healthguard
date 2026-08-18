import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VITAL_TYPES, VITAL_SOURCES } from '../../common/constants';

export class ImportReadingDto {
  @IsString()
  @IsIn(VITAL_TYPES)
  type: (typeof VITAL_TYPES)[number];

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  valueSecondary?: number;

  @IsDateString()
  recordedAt: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export const IMPORT_FORMATS = [
  'generic',
  'omron_csv',
  'withings_json',
  'apple_health',
  'fitbit_json',
  'health_connect',
] as const;

export class ImportVitalsDto {
  @IsString()
  @IsIn(VITAL_SOURCES.filter((s) => s !== 'MANUAL'))
  source: (typeof VITAL_SOURCES)[number];

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  /** Định dạng file/payload — bỏ qua nếu gửi readings trực tiếp */
  @IsOptional()
  @IsIn(IMPORT_FORMATS)
  format?: (typeof IMPORT_FORMATS)[number];

  /** Nội dung CSV hoặc JSON từ thiết bị */
  @IsOptional()
  payload?: string | Record<string, unknown> | unknown[];

  /** Mảng đã chuẩn hóa (mobile SDK gửi thẳng) */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportReadingDto)
  readings?: ImportReadingDto[];
}
