export interface ShortClassificationInput {
  durationSeconds: number | null;
  title: string | null;
  description: string | null;
}

export interface ShortClassificationResult {
  probableShort: boolean;
  shortConfidence: number;
  signals: {
    durationUpTo60Seconds: boolean;
    hasShortsHashtag: boolean;
    durationUpTo90AndDirectText: boolean;
  };
}

export const SHORT_CLASSIFIER_WEIGHTS: {
  durationUpTo60Seconds: number;
  hasShortsHashtag: number;
  durationUpTo90AndDirectText: number;
};

export function classifyProbableShort(
  input: ShortClassificationInput
): ShortClassificationResult;
