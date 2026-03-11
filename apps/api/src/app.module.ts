import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLoggerService } from './common/logger/structured-logger.service';
import { validateEnvironment } from './config/environment';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CollectionModule } from './modules/collection/collection.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { NichesModule } from './modules/niches/niches.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { SummariesModule } from './modules/summaries/summaries.module';
import { VideosModule } from './modules/videos/videos.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment
    }),
    PrismaModule,
    HealthModule,
    NichesModule,
    KeywordsModule,
    VideosModule,
    CollectionModule,
    DashboardModule,
    AnalyticsModule,
    SummariesModule,
    ScriptsModule
  ],
  providers: [StructuredLoggerService]
})
export class AppModule {}
