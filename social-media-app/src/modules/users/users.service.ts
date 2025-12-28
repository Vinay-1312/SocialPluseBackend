/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment,
@typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { users } from '../../database/schema';
import { eq, ne } from 'drizzle-orm';
import argon2 from 'argon2';
import { SignupDto } from 'src/common/dto/User';

@Injectable()
export class UsersService {
  constructor(private drizzle: DrizzleService) {}

  async signup(signupDto: SignupDto) {
    const { email, name, password } = signupDto;

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

  // Internal method - includes password (used for authentication)
  async findByEmail(email: string) {
    const [user] = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  // Public method - excludes password
  async findById(id: number) {
    const [user] = await this.drizzle.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Public method - excludes password
  async getAllUsers(excludeUserId?: number) {
    if (excludeUserId) {
      const allUsers = await this.drizzle.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(ne(users.id, excludeUserId));
      return allUsers;
    }

    const allUsers = await this.drizzle.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users);
    return allUsers;
  }
}
