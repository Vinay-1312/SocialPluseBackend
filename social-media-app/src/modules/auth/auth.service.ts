/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment,
@typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import argon2 from 'argon2';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { users, backupCodes } from 'src/database/schema';
import { UsersService } from '../users/users.service';
import { TotpService } from './totp.service';
import { TokenService } from './token.service';

interface SignupInitResponse {
  userId: number;
  email: string;
  totp: {
    qrCode: string;
    secret: string;
    backupCodes: string[];
  };
}

interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private totpService: TotpService,
    private tokenService: TokenService,
    @Inject(DrizzleService) private drizzle: DrizzleService,
  ) {}

  async verifyPassword(email: string, plainPassword: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return false;
    }

    return argon2.verify(user.password, plainPassword);
  }

  async signupInit(
    name: string,
    email: string,
    password: string,
  ): Promise<SignupInitResponse> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const { secret, otpauthUrl } = this.totpService.generateSecret();
    const encryptedSecret = this.totpService.encryptSecret(secret);

    const [newUser] = await this.drizzle.db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
        totpSecret: encryptedSecret,
        totpEnabled: false,
      })
      .returning();

    const qrCode = await this.totpService.generateQRCode(otpauthUrl);

    const backupCodesPlain = this.totpService.generateBackupCodes();

    for (const code of backupCodesPlain) {
      const hashedCode = await argon2.hash(code, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      await this.drizzle.db.insert(backupCodes).values({
        userId: newUser.id,
        code: hashedCode,
      });
    }

    return {
      userId: newUser.id,
      email: newUser.email,
      totp: {
        qrCode,
        secret,
        backupCodes: backupCodesPlain,
      },
    };
  }

  async verifySignupTotp(
    userId: number,
    totpCode: string,
  ): Promise<AuthResponse> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.totpEnabled) {
      throw new BadRequestException('TOTP already enabled for this user');
    }

    if (!user.totpSecret) {
      throw new BadRequestException('TOTP secret not found');
    }

    const decryptedSecret = this.totpService.decryptSecret(user.totpSecret);

    const isValid = this.totpService.verifyToken(decryptedSecret, totpCode);

    if (!isValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.drizzle.db
      .update(users)
      .set({
        totpEnabled: true,
        totpVerifiedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    await this.tokenService.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    };
  }

  async loginInit(
    email: string,
    password: string,
  ): Promise<{ loginSessionToken: string; userId: number }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const loginSessionToken = this.tokenService.generateLoginSessionToken(
      user.id,
    );

    return {
      loginSessionToken,
      userId: user.id,
    };
  }

  async verifyLoginTotp(
    loginSessionToken: string,
    totpCode?: string,
    backupCode?: string,
  ): Promise<AuthResponse> {
    let userId: number;
    try {
      const payload = this.tokenService.verifyToken(
        loginSessionToken,
        'login_session',
      );
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired login session');
    }

    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (backupCode) {
      const isBackupCodeValid = await this.verifyBackupCode(userId, backupCode);
      if (!isBackupCodeValid) {
        throw new UnauthorizedException('Invalid or already used backup code');
      }
    } else if (totpCode) {
      if (!user.totpSecret) {
        throw new BadRequestException('TOTP not set up for this user');
      }

      const decryptedSecret = this.totpService.decryptSecret(user.totpSecret);
      const isValid = this.totpService.verifyToken(decryptedSecret, totpCode);

      if (!isValid) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    } else {
      throw new BadRequestException('Either TOTP code or backup code required');
    }

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    await this.tokenService.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    };
  }

  private async verifyBackupCode(
    userId: number,
    backupCode: string,
  ): Promise<boolean> {
    const codes = await this.drizzle.db
      .select()
      .from(backupCodes)
      .where(and(eq(backupCodes.userId, userId), eq(backupCodes.used, false)));

    for (const storedCode of codes) {
      const isValid = await argon2.verify(storedCode.code, backupCode);
      if (isValid) {
        await this.drizzle.db
          .update(backupCodes)
          .set({ used: true, usedAt: new Date() })
          .where(eq(backupCodes.id, storedCode.id));

        return true;
      }
    }

    return false;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    let payload;
    try {
      payload = this.tokenService.verifyToken(refreshToken, 'refresh');
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isRevoked =
      await this.tokenService.isRefreshTokenRevoked(refreshToken);
    if (isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.tokenService.revokeRefreshToken(refreshToken);

    const newAccessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const newRefreshToken = this.tokenService.generateRefreshToken(user.id);

    await this.tokenService.storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }
}
