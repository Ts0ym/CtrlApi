import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  ADMIN_AUTH_TOKEN,
  ADMIN_PASSWORD,
  ADMIN_SESSION_USERNAME,
} from './auth.constants';

@Injectable()
export class AuthService {
  login(password: string) {
    if (password !== ADMIN_PASSWORD) {
      throw new UnauthorizedException('Invalid password');
    }

    return {
      token: ADMIN_AUTH_TOKEN,
      username: ADMIN_SESSION_USERNAME,
    };
  }

  validateToken(token?: string | null): boolean {
    return token === ADMIN_AUTH_TOKEN;
  }

  getSession() {
    return {
      authenticated: true,
      username: ADMIN_SESSION_USERNAME,
    };
  }
}
