import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';
import {
  AIProvider,
  GenerateStructuredSummaryInput,
  GenerateStructuredSummaryOutput
} from '../ai-provider.types';

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class OpenAIProvider implements AIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'OPENAI_API_BASE_URL',
      'https://api.openai.com/v1'
    );
    this.maxRetries = this.configService.get<number>('OPENAI_MAX_RETRIES', 3);
    this.timeoutMs = this.configService.get<number>('OPENAI_TIMEOUT_MS', 15000);
  }

  async generateStructuredSummary(
    input: GenerateStructuredSummaryInput
  ): Promise<GenerateStructuredSummaryOutput> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Integração com IA indisponível. Verifique OPENAI_API_KEY.'
      );
    }

    const body = JSON.stringify({
      model: input.model,
      messages: [
        {
          role: 'system',
          content:
            'Você é um analista de conteúdo de vídeos curtos. Responda somente com JSON válido.'
        },
        {
          role: 'user',
          content: input.prompt
        }
      ],
      temperature: 0.2
    });

    const response = await this.httpPostWithRetry(`${this.baseUrl}/chat/completions`, body, {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    const parsed = JSON.parse(response.body) as OpenAIResponse;
    const rawText = parsed.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      throw new ServiceUnavailableException('IA não retornou conteúdo válido.');
    }

    return { rawText };
  }

  private async httpPostWithRetry(
    url: string,
    body: string,
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: string }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.httpPost(url, body, headers);

        if (response.statusCode === 429 || (response.statusCode >= 500 && response.statusCode < 600)) {
          throw new Error(`OpenAI temporary error: HTTP ${response.statusCode}`);
        }

        if (response.statusCode >= 400) {
          throw new ServiceUnavailableException(
            `Serviço de IA indisponível no momento (HTTP ${response.statusCode}).`
          );
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn(
          JSON.stringify({
            event: 'openai_request_retry',
            attempt,
            maxRetries: this.maxRetries,
            error: lastError.message
          })
        );

        if (attempt < this.maxRetries) {
          await this.delay(300 * 2 ** (attempt - 1));
          continue;
        }
      }
    }

    throw new ServiceUnavailableException(
      `Serviço de IA indisponível após ${this.maxRetries} tentativas. Tente novamente. ${
        lastError ? `Detalhe: ${lastError.message}` : ''
      }`
    );
  }

  private httpPost(
    url: string,
    body: string,
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        url,
        {
          method: 'POST',
          headers
        },
        (res) => {
          let rawBody = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            rawBody += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode ?? 500, body: rawBody });
          });
        }
      );

      req.setTimeout(this.timeoutMs, () => {
        req.destroy(new Error(`OpenAI timeout após ${this.timeoutMs}ms`));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
