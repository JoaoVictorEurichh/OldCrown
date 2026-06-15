import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentsGateway } from './appointments.gateway';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

type JwtUser = { sub: string; email: string; role: string; name?: string };

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppointmentsGateway,
  ) {}

  findAll(jwtUser: JwtUser) {
    const where: any = { status: { not: 'CANCELED' } };
    if (jwtUser.role === 'BARBER') where.barber = jwtUser.name;
    return this.prisma.simpleAppointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  private isSlotInPast(date: string, time: string): boolean {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (date < today) return true;
    if (date > today) return false;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  }

  private isSunday(date: string): boolean {
    return new Date(date + 'T12:00:00').getDay() === 0;
  }

  async create(dto: CreateAppointmentDto, jwtUser: JwtUser) {
    if (this.isSunday(dto.date)) {
      throw new BadRequestException('A barbearia não funciona aos domingos');
    }
    if (this.isSlotInPast(dto.date, dto.time)) {
      throw new BadRequestException('Não é possível agendar em horários que já passaram');
    }

    const isAdmin = jwtUser.role === 'ADMIN';
    const isBarber = jwtUser.role === 'BARBER';

    if (isBarber) dto = { ...dto, barber: jwtUser.name ?? dto.barber };

    if (!isAdmin && !isBarber) {
      const existing = await this.prisma.simpleAppointment.findFirst({
        where: { userId: jwtUser.sub, status: { not: 'CANCELED' } },
      });
      if (existing) {
        throw new ConflictException(
          'Você já possui um agendamento ativo. Cancele-o antes de fazer um novo.',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: jwtUser.sub },
        select: { name: true },
      });
      dto = { ...dto, clientName: user?.name ?? dto.clientName };
    }

    const appointment = await this.prisma.$transaction(
      async (tx) => {
        const conflict = await tx.simpleAppointment.findFirst({
          where: {
            barber: dto.barber,
            date: dto.date,
            time: dto.time,
            status: { not: 'CANCELED' },
          },
        });
        if (conflict) {
          throw new ConflictException(
            `${dto.barber} já tem agendamento às ${dto.time} do dia ${dto.date}`,
          );
        }
        return tx.simpleAppointment.create({
          data: { ...dto, userId: (isAdmin || isBarber) ? null : jwtUser.sub },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.gateway.emitCreated(appointment);
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, jwtUser: JwtUser) {
    const isAdmin = jwtUser.role === 'ADMIN';
    const isBarber = jwtUser.role === 'BARBER';

    const appointment = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.simpleAppointment.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Agendamento não encontrado');

        if (isBarber && existing.barber !== jwtUser.name) {
          throw new ForbiddenException('Você só pode editar agendamentos da sua agenda');
        }
        if (!isAdmin && !isBarber && existing.userId !== jwtUser.sub) {
          throw new ForbiddenException('Você não pode editar o agendamento de outro cliente');
        }

        const targetDate = dto.date ?? existing.date;
        const targetTime = dto.time ?? existing.time;

        if (this.isSunday(targetDate)) {
          throw new BadRequestException('A barbearia não funciona aos domingos');
        }

        if (this.isSlotInPast(targetDate, targetTime)) {
          throw new BadRequestException('Não é possível mover para um horário que já passou');
        }

        const conflict = await tx.simpleAppointment.findFirst({
          where: {
            barber: existing.barber,
            date: targetDate,
            time: targetTime,
            status: { not: 'CANCELED' },
            id: { not: id },
          },
        });
        if (conflict) {
          throw new ConflictException(
            `${existing.barber} já tem agendamento às ${targetTime} do dia ${targetDate}`,
          );
        }

        return tx.simpleAppointment.update({ where: { id }, data: dto });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.gateway.emitUpdated(appointment);
    return appointment;
  }

  async remove(id: string, jwtUser: JwtUser) {
    const appointment = await this.prisma.simpleAppointment.findUnique({
      where: { id },
    });

    if (!appointment) throw new NotFoundException('Agendamento não encontrado');

    const isAdmin = jwtUser.role === 'ADMIN';
    const isBarber = jwtUser.role === 'BARBER';
    const isOwner = appointment.userId === jwtUser.sub;
    const isBarberOwner = isBarber && appointment.barber === jwtUser.name;

    if (!isAdmin && !isOwner && !isBarberOwner) {
      throw new ForbiddenException(
        'Você só pode cancelar agendamentos da sua agenda',
      );
    }

    const canceled = await this.prisma.simpleAppointment.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    this.gateway.emitCanceled(id);
    return canceled;
  }
}
