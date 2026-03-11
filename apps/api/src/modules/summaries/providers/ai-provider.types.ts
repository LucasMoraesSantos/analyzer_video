export interface GenerateStructuredSummaryInput {
  prompt: string;
  model: string;
}

export interface GenerateStructuredSummaryOutput {
  rawText: string;
}

export interface AIProvider {
  generateStructuredSummary(
    input: GenerateStructuredSummaryInput
  ): Promise<GenerateStructuredSummaryOutput>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';
