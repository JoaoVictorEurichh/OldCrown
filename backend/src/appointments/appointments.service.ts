import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const appointmentDate = new Date(data.date);

    const exists = await this.prisma.appointment.findFirst({
      where: {
        barberId: data.barberId,
        date: appointmentDate,
        status: {
          not: 'CANCELED',
        },
      },
    });

    if (exists) {
      throw new BadRequestException('Este barbeiro já possui agendamento neste horário.');
    }

    return this.prisma.appointment.create({
      data: {
        customerId: data.customerId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        barbershopId: data.barbershopId,
        date: appointmentDate,
        notes: data.notes,
      },
      include: {
        customer: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
        barbershop: true,
      },
    });
  }

  async findAll() {
    return this.prisma.appointment.findMany({
      include: {
        customer: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
        barbershop: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
        barbershop: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return appointment;
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    if (data.date || data.barberId) {
      const currentAppointment = await this.prisma.appointment.findUnique({
        where: { id },
      });

      if (!currentAppointment) {
        throw new NotFoundException('Agendamento não encontrado.');
      }

      const newDate = data.date ? new Date(data.date) : currentAppointment.date;
      const newBarberId = data.barberId ?? currentAppointment.barberId;

      const exists = await this.prisma.appointment.findFirst({
        where: {
          id: {
            not: id,
          },
          barberId: newBarberId,
          date: newDate,
          status: {
            not: 'CANCELED',
          },
        },
      });

      if (exists) {
        throw new BadRequestException('Este barbeiro já possui agendamento neste horário.');
      }
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        customer: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
        barbershop: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELED',
      },
    });
  }
}