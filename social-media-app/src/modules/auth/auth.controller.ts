import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SignupInitDto,
  SignupInitResponseDto,
  VerifyTotpDto,
  AuthResponseDto,
  LoginInitDto,
  LoginInitResponseDto,
  VerifyLoginTotpDto,
  RefreshTokenDto,
  TokensDto,
  LogoutDto,
} from 'src/common/dto/Auth';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/init')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize user signup with TOTP setup' })
  @ApiResponse({
    status: 201,
    description:
      'User created successfully. TOTP QR code and backup codes returned.',
    type: SignupInitResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async signupInit(@Body() dto: SignupInitDto): Promise<SignupInitResponseDto> {
    return this.authService.signupInit(dto.name, dto.email, dto.password);
  }

  @Post('signup/verify-totp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP code and complete registration' })
  @ApiResponse({
    status: 200,
    description: 'TOTP verified successfully. User registered and logged in.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid TOTP code' })
  @ApiResponse({ status: 400, description: 'TOTP already enabled' })
  async verifySignupTotp(@Body() dto: VerifyTotpDto): Promise<AuthResponseDto> {
    return this.authService.verifySignupTotp(dto.userId, dto.totpCode);
  }

  @Post('login/init')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize login with email and password' })
  @ApiResponse({
    status: 200,
    description:
      'Password verified successfully. Login session token returned.',
    type: LoginInitResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async loginInit(@Body() dto: LoginInitDto): Promise<LoginInitResponseDto> {
    return this.authService.loginInit(dto.email, dto.password);
  }

  @Post('login/verify-totp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify TOTP code or backup code and complete login',
  })
  @ApiResponse({
    status: 200,
    description: 'TOTP verified successfully. User logged in.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid TOTP code or backup code',
  })
  @ApiResponse({
    status: 400,
    description: 'Either TOTP code or backup code required',
  })
  async verifyLoginTotp(
    @Body() dto: VerifyLoginTotpDto,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyLoginTotp(
      dto.loginSessionToken,
      dto.totpCode,
      dto.backupCode,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
    type: TokensDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<TokensDto> {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  async logout(@Body() dto: LogoutDto): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
