import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiJobStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, AIProvider } from './providers/ai-provider.types';
import { parseSummaryOutput } from './services/summary-output-parser.logic';

interface SummaryGenerationResult {
  collectionJobId: string;
  processedVideos: number;
  completed: number;
  failed: number;
  fallbackUsed: number;
}

@Injectable()
export class SummariesService {
  private readonly logger = new Logger(SummariesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: AIProvider
  ) {}

  async generateForCollectionJob(
    collectionJobId: string
  ): Promise<SummaryGenerationResult> {
    const collectionJob = await this.prisma.collectionJob.findUnique({
      where: { id: collectionJobId },
      include: {
        niche: {
          include: {
            keywords: { where: { isActive: true } }
          }
        }
      }
    });

    if (!collectionJob) {
      throw new NotFoundException('CollectionJob não encontrado.');
    }

    const videos = await this.prisma.video.findMany({
      where: { nicheId: collectionJob.nicheId },
      orderBy: { updatedAt: 'desc' }
    });

    let completed = 0;
    let failed = 0;
    let fallbackUsed = 0;

    for (const video of videos) {
      const contentSummary = await this.prisma.contentSummary.create({
        data: {
          videoId: video.id,
          status: AiJobStatus.RUNNING
        }
      });

      const transcript = await this.prisma.transcript.findUnique({
        where: { videoId: video.id }
      });

      if (!transcript?.rawText) {
        this.logger.warn(
          JSON.stringify({
            event: 'summary_transcript_missing_fallback',
            collectionJobId,
            videoId: video.id
          })
        );
      }

      const prompt = this.buildPrompt({
        nicheName: collectionJob.niche.name,
        nicheKeywords: collectionJob.niche.keywords.map((k) => k.term),
        title: video.title,
        description: video.description,
        channelTitle: video.channelTitle,
        durationSeconds: video.durationSeconds,
        transcriptText: transcript?.rawText ?? null
      });

      const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

      try {
        const aiResult = await this.aiProvider.generateStructuredSummary({
          prompt,
          model
        });

        const parsed = parseSummaryOutput(aiResult.rawText);

        await this.prisma.contentSummary.update({
          where: { id: contentSummary.id },
          data: {
            status: AiJobStatus.COMPLETED,
            model,
            prompt,
            responseJson: parsed.parsed,
            generatedAt: new Date(),
            errorMessage: null
          }
        });

        completed += 1;
      } catch (error) {
        const fallback = this.buildFallbackSummary({
          nicheName: collectionJob.niche.name,
          title: video.title,
          description: video.description,
          channelTitle: video.channelTitle
        });

        await this.prisma.contentSummary.update({
          where: { id: contentSummary.id },
          data: {
            status: AiJobStatus.COMPLETED,
            model: 'fallback-local',
            prompt,
            responseJson: fallback,
            generatedAt: new Date(),
            errorMessage: `FALLBACK_APPLIED: ${error instanceof Error ? error.message : String(error)}`
          }
        });

        fallbackUsed += 1;
        completed += 1;

        this.logger.warn(
          JSON.stringify({
            event: 'summary_fallback_applied',
            collectionJobId,
            videoId: video.id,
            error: error instanceof Error ? error.message : String(error)
          })
        );
      }
    }

    return {
      collectionJobId,
      processedVideos: videos.length,
      completed,
      failed,
      fallbackUsed
    };
  }

  private buildPrompt(input: {
    nicheName: string;
    nicheKeywords: string[];
    title: string;
    description: string | null;
    channelTitle: string | null;
    durationSeconds: number | null;
    transcriptText: string | null;
  }): string {
    const transcriptSection = input.transcriptText
      ? `Transcrição:\n${input.transcriptText}`
      : 'Transcrição indisponível. Use metadados de título/descrição/canal/duração.';

    return [
      'Gere uma saída JSON estritamente válida com os campos abaixo:',
      'temaCentral, nicho, ganchoInicial, promessa, estruturaDoVideo, tom, emocaoPredominante, elementosVirais, publicoProvavel, palavrasChave, resumoExecutivo, insightDeRecriacao, riscosDeCopia, roteiroBaseInspiracional.',
      '',
      `Nicho: ${input.nicheName}`,
      `Keywords do nicho: ${input.nicheKeywords.join(', ')}`,
      `Título do vídeo: ${input.title}`,
      `Descrição do vídeo: ${input.description ?? 'N/A'}`,
      `Canal: ${input.channelTitle ?? 'N/A'}`,
      `Duração (segundos): ${input.durationSeconds ?? 'N/A'}`,
      transcriptSection,
      '',
      'Regras:',
      '- Responder somente JSON, sem markdown.',
      '- palavrasChave e elementosVirais podem ser arrays.',
      '- Seja objetivo e útil para análise e recriação.'
    ].join('\n');
  }

  private buildFallbackSummary(input: {
    nicheName: string;
    title: string;
    description: string | null;
    channelTitle: string | null;
  }) {
    return {
      temaCentral: input.title,
      nicho: input.nicheName,
      ganchoInicial: 'Gancho não identificado automaticamente.',
      promessa: 'Promessa não identificada automaticamente.',
      estruturaDoVideo: 'Estrutura inferida por fallback de metadados.',
      tom: 'Neutro',
      emocaoPredominante: 'Curiosidade',
      elementosVirais: ['título chamativo'],
      publicoProvavel: input.nicheName,
      palavrasChave: [input.nicheName.toLowerCase()],
      resumoExecutivo: input.description ?? `Vídeo do canal ${input.channelTitle ?? 'desconhecido'}.`,
      insightDeRecriacao: 'Reprocessar com IA quando o serviço externo normalizar.',
      riscosDeCopia: 'Baixa confiança por fallback sem IA.',
      roteiroBaseInspiracional: 'Criar roteiro a partir do tema central e promessa simplificada.'
    };
  }
}
