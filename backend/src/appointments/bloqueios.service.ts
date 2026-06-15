import { ForbiddenException, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type JwtUser = { sub: string; email: string; role: string };

@Injectable()
export class BloqueiosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.slotBloqueado.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async create(dto: { date: string; time: string; barber: string; motivo?: string }, jwtUser: JwtUser) {
    if (jwtUser.role !== 'ADMIN') throw new ForbiddenException('Apenas administradores podem bloquear horários');

    try {
      return await this.prisma.slotBloqueado.create({ data: dto });
    } catch {
      throw new ConflictException('Horário já está bloqueado');
    }
  }

  async remove(id: string, jwtUser: JwtUser) {
    if (jwtUser.role !== 'ADMIN') throw new ForbiddenException('Apenas administradores podem desbloquear horários');

    const slot = await this.prisma.slotBloqueado.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Bloqueio não encontrado');

    return this.prisma.slotBloqueado.delete({ where: { id } });
  }
}