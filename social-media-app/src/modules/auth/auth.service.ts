/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment,
@typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { SignupDto } from 'src/common/dto/User';

@Injectable()
export class AuthService {
  constructor(private drizzle: DrizzleService) {}

  async signup(signupDto: SignupDto) {
    const { email, name, password } = signupDto;

    // Validate inputs
    if (!email || !name || !password) {
      throw new BadRequestException('Email, name, and password are required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Check if user already exists
    const [existingUser] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password using Argon2
    const hashedPassword = (await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    })) as string;

    // Create user in database
    const [user] = await this.drizzle.db
      .insert(users)
      .values({
        email: email,
        name: name,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    return {
      success: true,
      message: 'User created successfully',
      user,
    };
  }

  async verifyPassword(email: string, plainPassword: string): Promise<boolean> {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return false;
    }

    return argon2.verify(user.password, plainPassword);
  }
}
