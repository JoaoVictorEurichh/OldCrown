import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const hashed = await bcrypt.hash(data.password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          role: (data.role as Role) ?? Role.CUSTOMER,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('E-mail já cadastrado');
      throw e;
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
