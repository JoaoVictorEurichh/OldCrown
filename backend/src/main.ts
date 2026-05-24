import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

<<<<<<< HEAD
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
=======
import helmet from 'helmet';

async function bootstrap() {

  const app =
    await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors();

  await app.listen(
    process.env.PORT ?? 3333,
  );
}

bootstrap();
>>>>>>> 0940b38 (Initial commit)
