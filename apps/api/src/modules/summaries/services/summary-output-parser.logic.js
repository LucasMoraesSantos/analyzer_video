const REQUIRED_KEYS = [
  'temaCentral',
  'nicho',
  'ganchoInicial',
  'promessa',
  'estruturaDoVideo',
  'tom',
  'emocaoPredominante',
  'elementosVirais',
  'publicoProvavel',
  'palavrasChave',
  'resumoExecutivo',
  'insightDeRecriacao',
  'riscosDeCopia',
  'roteiroBaseInspiracional'
];

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractJsonBlock(raw) {
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first < 0 || last <= first) {
    return null;
  }
  return raw.slice(first, last + 1);
}

function sanitizeJsonCandidate(raw) {
  return raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function validateStructuredOutput(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'JSON não é objeto.' };
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in parsed)) {
      return { ok: false, reason: `Campo obrigatório ausente: ${key}` };
    }
  }

  return { ok: true };
}

function parseSummaryOutput(rawText) {
  const direct = tryParseJson(rawText);
  if (direct) {
    const validation = validateStructuredOutput(direct);
    if (validation.ok) {
      return { parsed: direct, recovered: false };
    }
  }

  const extracted = extractJsonBlock(rawText);
  if (!extracted) {
    throw new Error('Não foi possível extrair bloco JSON da resposta do modelo.');
  }

  const sanitized = sanitizeJsonCandidate(extracted);
  const recovered = tryParseJson(sanitized);

  if (!recovered) {
    throw new Error('Falha ao recuperar JSON malformado da resposta do modelo.');
  }

  const validation = validateStructuredOutput(recovered);
  if (!validation.ok) {
    throw new Error(`Saída inválida do modelo: ${validation.reason}`);
  }

  return { parsed: recovered, recovered: true };
}

module.exports = {
  REQUIRED_KEYS,
  parseSummaryOutput
};
