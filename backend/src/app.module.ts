import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
<<<<<<< HEAD

@Module({
  imports: [PrismaModule, UsersModule],
=======
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
>>>>>>> 0940b38 (Initial commit)
})
export class AppModule {}