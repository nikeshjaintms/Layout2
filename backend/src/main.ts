import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedPatterns = [
        /^http:\/\/localhost(:[0-9]+)?$/,
        /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
        /\.delawalagroup\.com$/,
      ];
      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));
      return callback(null, isAllowed);
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'Content-Type'],
  });

  app.use(cookieParser());

  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:        true,
      forbidNonWhitelisted: false,
      transform:        true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(5000);
  logger.log('Backend running at http://localhost:5000');
  console.log("Backend running at http://localhost:5000")
}
bootstrap();

// Trigger restart
