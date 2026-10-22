import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentPlan, PaymentMethod } from '@prisma/client';

export class CreateBookingDto {
  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsString()
  customerId!: string;

  @IsNotEmpty({ message: 'Plot ID is required' })
  @IsString()
  plotId!: string;

  @IsOptional()
  @IsString()
  brokerId?: string;

  @IsNotEmpty({ message: 'Agreed rate per sq. ft. is required' })
  @IsNumber()
  @Min(1)
  agreedRatePerSqFt!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingAdvancePaid?: number;

  @IsOptional()
  @IsEnum(PaymentPlan)
  paymentPlan?: PaymentPlan;

  @IsOptional()
  @IsNumber()
  @Min(1)
  installmentCount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  advancePaymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  advancePaymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
