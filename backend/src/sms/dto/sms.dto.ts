import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SendCustomSmsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[0-9]{10,14}$/, {
    message: 'recipientPhone must be a valid 10 to 14-digit telephone number',
  })
  recipientPhone: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  recipientName?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'messageBody must be at least 5 characters long' })
  @MaxLength(500, { message: 'messageBody cannot exceed 500 characters' })
  messageBody: string;
}

export class RemindInstallmentDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsNumber()
  @IsPositive()
  installmentNumber: number;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsNotEmpty()
  plotNumber: string;
}
