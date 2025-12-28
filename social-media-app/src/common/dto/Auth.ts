import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupInitDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description:
      'User password (must contain at least one uppercase letter, one lowercase letter, and one number)',
    example: 'Password123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}

export class TotpDataDto {
  @ApiProperty({
    description: 'QR code as data URI for scanning with authenticator app',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'TOTP secret for manual entry',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'Backup codes for account recovery (10 codes)',
    example: ['1A2B3C4D', '5E6F7G8H', '9I0J1K2L'],
    type: [String],
  })
  backupCodes: string[];
}

export class SignupInitResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 42,
  })
  userId: number;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'TOTP setup data',
    type: TotpDataDto,
  })
  totp: TotpDataDto;
}

export class VerifyTotpDto {
  @ApiProperty({
    description: 'User ID from signup init response',
    example: 42,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  totpCode: string;
}

export class LoginInitDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginInitResponseDto {
  @ApiProperty({
    description: 'Temporary login session token (valid for 5 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  loginSessionToken: string;

  @ApiProperty({
    description: 'User ID',
    example: 42,
  })
  userId: number;
}

export class VerifyLoginTotpDto {
  @ApiProperty({
    description: 'Login session token from login init response',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  loginSessionToken: string;

  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
    required: false,
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(6)
  totpCode?: string;

  @ApiProperty({
    description: '8-character backup code (alternative to TOTP code)',
    example: '1A2B3C4D',
    required: false,
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(8)
  backupCode?: string;
}

export class TokensDto {
  @ApiProperty({
    description: 'JWT access token (valid for 15 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token (valid for 30 days)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiry time in seconds',
    example: 900,
  })
  expiresIn: number;
}

export class UserDataDto {
  @ApiProperty({
    description: 'User ID',
    example: 42,
  })
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User data',
    type: UserDataDto,
  })
  user: UserDataDto;

  @ApiProperty({
    description: 'Authentication tokens',
    type: TokensDto,
  })
  tokens: TokensDto;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to exchange for new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token to revoke',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
