import { ForbiddenException, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type JwtUser = { sub: string; email: string; role: string; name?: string };

@Injectable()
export class BloqueiosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.slotBloqueado.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async create(dto: { date: string; time: string; barber: string; motivo?: string }, jwtUser: JwtUser) {
    const isAdmin = jwtUser.role === 'ADMIN';
    const isBarber = jwtUser.role === 'BARBER';

    if (!isAdmin && !isBarber) {
      throw new ForbiddenException('Apenas administradores e barbeiros podem bloquear horários');
    }

    if (isBarber) {
      dto = { ...dto, barber: jwtUser.name ?? dto.barber };
    }

    try {
      return await this.prisma.slotBloqueado.create({ data: dto });
    } catch {
      throw new ConflictException('Horário já está bloqueado');
    }
  }

  async remove(id: string, jwtUser: JwtUser) {
    const isAdmin = jwtUser.role === 'ADMIN';
    const isBarber = jwtUser.role === 'BARBER';

    if (!isAdmin && !isBarber) {
      throw new ForbiddenException('Apenas administradores e barbeiros podem desbloquear horários');
    }

    const slot = await this.prisma.slotBloqueado.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Bloqueio não encontrado');

    if (isBarber && slot.barber !== jwtUser.name) {
      throw new ForbiddenException('Você só pode remover bloqueios da sua agenda');
    }

    return this.prisma.slotBloqueado.delete({ where: { id } });
  }
}