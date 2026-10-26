import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum SmsProviderType {
  Simulated = 'SIMULATED',
  Twilio = 'TWILIO',
  Fast2Sms = 'FAST2SMS',
  AwsSns = 'AWS_SNS',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1024)
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required and cannot be empty' })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required and cannot be empty' })
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long for production security' })
  JWT_SECRET: string;

  @IsEnum(SmsProviderType)
  @IsOptional()
  SMS_PROVIDER: SmsProviderType = SmsProviderType.Simulated;

  @IsString()
  @IsOptional()
  SMS_API_KEY?: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string = 'http://localhost:3000';
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors.map((err) => {
      return {
        property: err.property,
        constraints: err.constraints,
      };
    });
    throw new Error(
      `🚨 [FATAL] Environment Configuration Validation Failed:\n${JSON.stringify(formattedErrors, null, 2)}`,
    );
  }

  return validatedConfig;
}
