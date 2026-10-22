import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CreateBrokerDto {
  @IsNotEmpty({ message: 'Broker full name is required' })
  @IsString()
  fullName!: string;

  @IsNotEmpty({ message: 'Primary phone is required' })
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  agencyName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Valid email is required' })
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(CommissionType)
  commissionType?: CommissionType;

  @IsOptional()
  @IsNumber()
  defaultCommissionValue?: number;
}
