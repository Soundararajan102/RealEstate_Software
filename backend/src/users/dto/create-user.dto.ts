import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName!: string;

  @IsEmail({}, { message: 'Valid email is required' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @IsEnum(Role, { message: 'Role must be ADMIN, SALES_EXECUTIVE, or ACCOUNTS_EXECUTIVE' })
  role!: Role;

  @IsOptional()
  assignedProjects?: string[];
}
