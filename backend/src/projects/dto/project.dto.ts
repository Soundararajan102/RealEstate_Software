import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProjectStatus, Facing, PlotStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Project name is required' })
  @IsString()
  name!: string;

  @IsNotEmpty({ message: 'Location is required' })
  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  totalAreaSqFt?: number;

  @IsOptional()
  @IsNumber()
  totalPlots?: number;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class CreatePlotDto {
  @IsNotEmpty({ message: 'Plot number is required' })
  @IsString()
  plotNumber!: string;

  @IsOptional()
  @IsString()
  surveyNumber?: string;

  @IsOptional()
  @IsEnum(Facing)
  facing?: Facing;

  @IsOptional()
  @IsString()
  dimension?: string;

  @IsNotEmpty({ message: 'Area in sq. ft. is required' })
  @IsNumber()
  areaSqFt!: number;

  @IsNotEmpty({ message: 'Rate per sq. ft. is required' })
  @IsNumber()
  ratePerSqFt!: number;

  @IsOptional()
  isCornerPlot?: boolean;

  @IsOptional()
  @IsEnum(PlotStatus)
  status?: PlotStatus;
}
