import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class DatabaseConfigDto {
  @ApiProperty({ example: 'localhost' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ example: 5432, minimum: 1, maximum: 65535 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ example: 'postgres' })
  @IsString()
  @IsNotEmpty()
  user: string;

  @ApiProperty({ example: 'secret' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'db_source' })
  @IsString()
  @IsNotEmpty()
  database: string;
}
