export interface SummaryParserResult {
  parsed: Record<string, unknown>;
  recovered: boolean;
}

export const REQUIRED_KEYS: string[];

export function parseSummaryOutput(rawText: string): SummaryParserResult;
