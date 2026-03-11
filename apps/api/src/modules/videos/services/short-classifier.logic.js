const SHORT_CLASSIFIER_WEIGHTS = {
  durationUpTo60Seconds: 0.55,
  hasShortsHashtag: 0.35,
  durationUpTo90AndDirectText: 0.2
};

function normalizeText(text) {
  return (text ?? '').trim().toLowerCase();
}

function hasShortsHashtag(title, description) {
  const text = `${normalizeText(title)} ${normalizeText(description)}`;
  return /(^|\s)#shorts(\s|$)/i.test(text);
}

function isDirectShortText(title, description) {
  const merged = `${normalizeText(title)} ${normalizeText(description)}`.trim();
  if (!merged) {
    return false;
  }

  const words = merged.split(/\s+/).filter(Boolean);
  return merged.length <= 140 || words.length <= 20;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundConfidence(value) {
  return Number(value.toFixed(2));
}

function classifyProbableShort(input) {
  const durationSeconds = input.durationSeconds ?? null;
  const title = input.title ?? null;
  const description = input.description ?? null;

  let confidence = 0;

  if (typeof durationSeconds === 'number' && durationSeconds <= 60) {
    confidence += SHORT_CLASSIFIER_WEIGHTS.durationUpTo60Seconds;
  }

  if (hasShortsHashtag(title, description)) {
    confidence += SHORT_CLASSIFIER_WEIGHTS.hasShortsHashtag;
  }

  if (
    typeof durationSeconds === 'number' &&
    durationSeconds <= 90 &&
    isDirectShortText(title, description)
  ) {
    confidence += SHORT_CLASSIFIER_WEIGHTS.durationUpTo90AndDirectText;
  }

  const normalizedConfidence = roundConfidence(clamp(confidence, 0, 1));

  return {
    probableShort: normalizedConfidence >= 0.6,
    shortConfidence: normalizedConfidence,
    signals: {
      durationUpTo60Seconds:
        typeof durationSeconds === 'number' && durationSeconds <= 60,
      hasShortsHashtag: hasShortsHashtag(title, description),
      durationUpTo90AndDirectText:
        typeof durationSeconds === 'number' &&
        durationSeconds <= 90 &&
        isDirectShortText(title, description)
    }
  };
}

module.exports = {
  SHORT_CLASSIFIER_WEIGHTS,
  classifyProbableShort
};
