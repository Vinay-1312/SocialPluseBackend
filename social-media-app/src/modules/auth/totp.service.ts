/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as CryptoJS from 'crypto-js';
import * as crypto from 'crypto';

@Injectable()
export class TotpService {
  private readonly encryptionKey: string;
  private readonly totpIssuer: string;
  private readonly totpAppName: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey =
      this.configService.get<string>('TOTP_ENCRYPTION_KEY') || '';
    this.totpIssuer =
      this.configService.get<string>('TOTP_ISSUER') || 'SocialPulse';
    this.totpAppName =
      this.configService.get<string>('TOTP_APP_NAME') || 'SocialPulse App';
  }

  generateSecret(): { secret: string; otpauthUrl: string } {
    const secret = speakeasy.generateSecret({
      name: this.totpAppName,
      issuer: this.totpIssuer,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || '',
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow ±30 seconds for clock skew
    });
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  encryptSecret(secret: string): string {
    if (!this.encryptionKey) {
      throw new Error('TOTP_ENCRYPTION_KEY is not configured');
    }
    return CryptoJS.AES.encrypt(secret, this.encryptionKey).toString();
  }

  decryptSecret(encryptedSecret: string): string {
    if (!this.encryptionKey) {
      throw new Error('TOTP_ENCRYPTION_KEY is not configured');
    }
    const bytes = CryptoJS.AES.decrypt(encryptedSecret, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
