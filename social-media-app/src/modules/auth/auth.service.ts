/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment,
@typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async verifyPassword(email: string, plainPassword: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return false;
    }

    return argon2.verify(user.password, plainPassword);
  }
}
