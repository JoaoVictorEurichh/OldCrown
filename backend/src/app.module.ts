import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, AppointmentsModule],
<<<<<<< HEAD
=======
  controllers: [AppController],
>>>>>>> 9c63714a3c7a420bead7fd3949cb960af66a7df0
})
export class AppModule {}
