import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');

  const config = new DocumentBuilder()
    .setTitle('Analyzer Video API')
    .setDescription('API para análise de vídeos curtos por nicho')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);

  logger.log(JSON.stringify({ event: 'api_started', port }));
}

void bootstrap();
