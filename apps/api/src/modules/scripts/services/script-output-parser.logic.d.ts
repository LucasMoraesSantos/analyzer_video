export interface ScriptParserResult {
  parsed: Record<string, unknown>;
  recovered: boolean;
}

export const REQUIRED_KEYS: string[];

export function parseScriptOutput(rawText: string): ScriptParserResult;
