/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { refreshTokens } from 'src/database/schema';

interface TokenPayload {
  sub: number;
  email?: string;
  type: 'access' | 'refresh' | 'login_session';
  tokenId?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(DrizzleService) private drizzle: DrizzleService,
  ) {}

  generateAccessToken(userId: number, email: string): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn:
        this.configService.get<number>('JWT_ACCESS_EXPIRY_SECONDS') || 900, // 15 minutes
    });
  }

  generateRefreshToken(userId: number): string {
    const tokenId = crypto.randomUUID();
    const payload: TokenPayload = {
      sub: userId,
      type: 'refresh',
      tokenId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRY') || 86400,
    });
  }

  generateLoginSessionToken(userId: number): string {
    const payload: TokenPayload = {
      sub: userId,
      type: 'login_session',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '5m',
    });
  }

  verifyToken(
    token: string,
    type: 'access' | 'refresh' | 'login_session',
  ): TokenPayload {
    const secret =
      type === 'refresh'
        ? this.configService.get<string>('JWT_REFRESH_SECRET')
        : this.configService.get<string>('JWT_SECRET');

    const payload = this.jwtService.verify<TokenPayload>(token, { secret });

    if (payload.type !== type) {
      throw new Error('Invalid token type');
    }

    return payload;
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async storeRefreshToken(
    userId: number,
    token: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<void> {
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRY') || '30'),
    );

    await this.drizzle.db.insert(refreshTokens).values({
      userId,
      token: hashedToken,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    await this.drizzle.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, hashedToken));
  }

  async isRefreshTokenRevoked(token: string): Promise<boolean> {
    const hashedToken = this.hashToken(token);

    const result = await this.drizzle.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, hashedToken))
      .limit(1);

    if (result.length === 0) {
      return true; // Token not found, consider it revoked
    }

    return result[0].revokedAt !== null;
  }
}
