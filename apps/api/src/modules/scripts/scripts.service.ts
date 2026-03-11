import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AiJobStatus, ScriptDuration } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, AIProvider } from '../summaries/providers/ai-provider.types';
import { parseScriptOutput } from './services/script-output-parser.logic';

interface ScriptGenerationBatchResult {
  collectionJobId: string;
  processedVideos: number;
  generatedScripts: number;
  failedScripts: number;
}

@Injectable()
export class ScriptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: AIProvider
  ) {}

  async generateForCollectionJob(
    collectionJobId: string
  ): Promise<ScriptGenerationBatchResult> {
    const collectionJob = await this.prisma.collectionJob.findUnique({
      where: { id: collectionJobId },
      include: { niche: true }
    });

    if (!collectionJob) {
      throw new NotFoundException('CollectionJob não encontrado.');
    }

    const videos = await this.prisma.video.findMany({
      where: { nicheId: collectionJob.nicheId },
      include: {
        contentSummaries: {
          where: { status: AiJobStatus.COMPLETED },
          orderBy: { generatedAt: 'desc' },
          take: 1
        }
      }
    });

    let generatedScripts = 0;
    let failedScripts = 0;

    for (const video of videos) {
      const summary = video.contentSummaries[0];
      if (!summary) {
        continue;
      }

      for (const duration of [ScriptDuration.S30, ScriptDuration.S45, ScriptDuration.S60]) {
        const scriptGeneration = await this.prisma.scriptGeneration.create({
          data: {
            videoId: video.id,
            contentSummaryId: summary.id,
            status: AiJobStatus.RUNNING,
            duration
          }
        });

        try {
          const prompt = this.buildPrompt({
            duration,
            nicheName: collectionJob.niche.name,
            summaryJson: summary.responseJson
          });

          const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
          const aiResult = await this.aiProvider.generateStructuredSummary({
            prompt,
            model
          });

          const parsed = parseScriptOutput(aiResult.rawText);

          await this.prisma.scriptGeneration.update({
            where: { id: scriptGeneration.id },
            data: {
              status: AiJobStatus.COMPLETED,
              model,
              prompt,
              responseJson: parsed.parsed,
              generatedAt: new Date(),
              errorMessage: null
            }
          });

          generatedScripts += 1;
        } catch (error) {
          await this.prisma.scriptGeneration.update({
            where: { id: scriptGeneration.id },
            data: {
              status: AiJobStatus.FAILED,
              errorMessage: error instanceof Error ? error.message : String(error)
            }
          });
          failedScripts += 1;
        }
      }
    }

    return {
      collectionJobId,
      processedVideos: videos.length,
      generatedScripts,
      failedScripts
    };
  }

  async listByVideo(videoId: string) {
    return this.prisma.scriptGeneration.findMany({
      where: { videoId },
      orderBy: [{ createdAt: 'desc' }, { duration: 'asc' }]
    });
  }

  async listBySummary(summaryId: string) {
    return this.prisma.scriptGeneration.findMany({
      where: { contentSummaryId: summaryId },
      orderBy: [{ createdAt: 'desc' }, { duration: 'asc' }]
    });
  }

  private buildPrompt(input: {
    duration: ScriptDuration;
    nicheName: string;
    summaryJson: unknown;
  }): string {
    const durationLabel = input.duration === ScriptDuration.S30 ? '30s' : input.duration === ScriptDuration.S45 ? '45s' : '60s';

    return [
      `Gere um roteiro derivado para vídeo curto de ${durationLabel}.`,
      'Responda SOMENTE com JSON válido e com os campos obrigatórios:',
      'hook, abertura, desenvolvimento, fechamento, cta, sugestoesTextoTela, sugestaoNarracao, sugestoesCortesCenas.',
      '',
      `Nicho: ${input.nicheName}`,
      `Resumo estruturado de referência: ${JSON.stringify(input.summaryJson)}`,
      '',
      'Regras:',
      '- Estrutura clara e previsível para frontend.',
      '- cta objetivo.',
      '- sugestoesTextoTela e sugestoesCortesCenas preferencialmente arrays.',
      '- Não incluir markdown.'
    ].join('\n');
  }
}
