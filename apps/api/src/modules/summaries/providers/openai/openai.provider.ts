import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'OPENAI_API_BASE_URL',
      'https://api.openai.com/v1'
    );
  }

  async generateStructuredSummary(
    input: GenerateStructuredSummaryInput
  ): Promise<GenerateStructuredSummaryOutput> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY não configurada.');
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

    const response = await this.httpPost(`${this.baseUrl}/chat/completions`, body, {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    if (response.statusCode >= 400) {
      throw new ServiceUnavailableException(
        `OpenAI retornou erro HTTP ${response.statusCode}.`
      );
    }

    const parsed = JSON.parse(response.body) as OpenAIResponse;
    const rawText = parsed.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      throw new ServiceUnavailableException('OpenAI não retornou conteúdo válido.');
    }

    return { rawText };
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

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
