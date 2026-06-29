import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class DatabaseConfigDto {
  @IsString()
  @IsNotEmpty()
  host: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  database: string;
}
