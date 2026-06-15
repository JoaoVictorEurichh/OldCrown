import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
<<<<<<< HEAD
  app.enableCors({ origin: '*' });
=======
  app.enableCors();
>>>>>>> 9c63714a3c7a420bead7fd3949cb960af66a7df0

  await app.listen(process.env.PORT ?? 3333);
}

<<<<<<< HEAD
bootstrap();
=======
bootstrap();
>>>>>>> 9c63714a3c7a420bead7fd3949cb960af66a7df0
