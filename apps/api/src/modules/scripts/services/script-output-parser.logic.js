const REQUIRED_KEYS = [
  'hook',
  'abertura',
  'desenvolvimento',
  'fechamento',
  'cta',
  'sugestoesTextoTela',
  'sugestaoNarracao',
  'sugestoesCortesCenas'
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

function validate(parsed) {
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

function parseScriptOutput(rawText) {
  const direct = tryParseJson(rawText);
  if (direct) {
    const v = validate(direct);
    if (v.ok) {
      return { parsed: direct, recovered: false };
    }
  }

  const extracted = extractJsonBlock(rawText);
  if (!extracted) {
    throw new Error('Não foi possível extrair JSON da resposta de roteiro.');
  }

  const recovered = tryParseJson(sanitizeJsonCandidate(extracted));
  if (!recovered) {
    throw new Error('Falha ao recuperar JSON malformado do roteiro.');
  }

  const v = validate(recovered);
  if (!v.ok) {
    throw new Error(`Saída inválida de roteiro: ${v.reason}`);
  }

  return { parsed: recovered, recovered: true };
}

module.exports = {
  REQUIRED_KEYS,
  parseScriptOutput
};
