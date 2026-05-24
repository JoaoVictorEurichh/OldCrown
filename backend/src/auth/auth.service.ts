import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    private jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ) {

    if (
      email !== 'admin@email.com' ||
      password !== '123456'
    ) {
      throw new UnauthorizedException(
        'Credenciais inválidas',
      );
    }

    const payload = {
      sub: 1,
      email,
    };

    return {
      access_token:
        this.jwtService.sign(payload),
    };
  }
}