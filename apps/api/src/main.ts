import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { StructuredLoggerService } from './common/logger/structured-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const appLogger = app.get(StructuredLoggerService, { strict: false });
  const logger = appLogger ?? new Logger('Bootstrap');

  if (appLogger) {
    app.useLogger(appLogger);
  }

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const port = configService.get<number>('API_PORT', 3001);

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Analyzer Video API')
    .setDescription('API para análise de vídeos curtos por nicho')
    .setVersion('0.2.0')
    .addServer(`/${apiPrefix}`)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);

  logger.log({ event: 'api_started', port, apiPrefix }, 'Bootstrap');
}

void bootstrap();
