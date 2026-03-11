import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScriptText } from '../video-detail.logic.js';

test('buildScriptText retorna fallback para payload inválido', () => {
  assert.equal(buildScriptText(null), 'Roteiro indisponível');
});

test('buildScriptText formata blocos principais do roteiro', () => {
  const text = buildScriptText({
    hook: 'Hook X',
    abertura: 'Abertura X',
    desenvolvimento: 'Desenvolvimento X',
    fechamento: 'Fechamento X',
    cta: 'CTA X'
  });

  assert.equal(
    text,
    'Hook: Hook X\n\nAbertura: Abertura X\n\nDesenvolvimento: Desenvolvimento X\n\nFechamento: Fechamento X\n\nCTA: CTA X'
  );
});
