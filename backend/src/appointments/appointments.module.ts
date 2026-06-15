import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsGateway } from './appointments.gateway';
import { AppointmentsService } from './appointments.service';
import { BloqueiosController } from './bloqueios.controller';
import { BloqueiosService } from './bloqueios.service';

@Module({
  controllers: [AppointmentsController, BloqueiosController],
  providers: [AppointmentsService, AppointmentsGateway, BloqueiosService],
})
export class AppointmentsModule {}
