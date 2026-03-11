function buildScriptText(responseJson) {
  if (!responseJson || typeof responseJson !== 'object' || Array.isArray(responseJson)) {
    return 'Roteiro indisponível';
  }

  const script = responseJson;
  const fields = [
    ['Hook', script.hook],
    ['Abertura', script.abertura],
    ['Desenvolvimento', script.desenvolvimento],
    ['Fechamento', script.fechamento],
    ['CTA', script.cta]
  ];

  return fields
    .map(([label, value]) => `${label}: ${typeof value === 'string' ? value : '—'}`)
    .join('\n\n');
}

module.exports = {
  buildScriptText
};
