import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyProbableShort } from '../short-classifier.logic.js';

test('classifica como provável short com duração <= 60 e #shorts', () => {
  const result = classifyProbableShort({
    durationSeconds: 42,
    title: '3 dicas rápidas #shorts',
    description: 'aprenda em 30 segundos'
  });

  assert.equal(result.probableShort, true);
  assert.ok(result.shortConfidence >= 0.9);
});

test('classifica como sinal moderado com duração <= 90 e texto curto', () => {
  const result = classifyProbableShort({
    durationSeconds: 85,
    title: 'Treino rápido para pernas',
    description: 'Faça agora'
  });

  assert.equal(result.probableShort, false);
  assert.ok(result.shortConfidence >= 0.2);
  assert.ok(result.shortConfidence < 0.6);
});

test('não classifica como provável short sem sinais', () => {
  const result = classifyProbableShort({
    durationSeconds: 300,
    title: 'Análise completa de mercado',
    description:
      'Vídeo longo com explicações detalhadas, múltiplos tópicos e contexto aprofundado.'
  });

  assert.equal(result.probableShort, false);
  assert.equal(result.shortConfidence, 0);
});
