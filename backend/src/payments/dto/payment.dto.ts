import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'Booking ID is required' })
  @IsString()
  bookingId!: string;

  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(1, { message: 'Payment amount must be greater than 0' })
  amount!: number;

  @IsEnum(PaymentMethod, { message: 'Payment method must be CASH, CHEQUE, BANK_TRANSFER, or UPI' })
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
