import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateTrendScore } from '../trend-score.logic.js';

test('classifica EXPLODINDO quando sinais fortes combinam', () => {
  const result = calculateTrendScore({
    title: '3 hacks de vendas hoje',
    description: 'copywriting e fechamento rápido',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nicheKeywords: ['vendas', 'copywriting', 'fechamento'],
    latestSnapshot: {
      capturedAt: new Date(),
      viewCount: 120000,
      likeCount: 120000,
      commentCount: 120000
    },
    previousSnapshot: {
      capturedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      viewCount: 10000,
      likeCount: 500,
      commentCount: 100
    }
  });

  assert.equal(result.trendClassification, 'EXPLODINDO');
  assert.equal(result.trendDirection, 'UP');
  assert.ok(result.trendScore >= 80);
});

test('classifica SATURADO com baixo desempenho', () => {
  const result = calculateTrendScore({
    title: 'conteúdo geral',
    description: 'sem foco de keyword',
    publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    nicheKeywords: ['finanças', 'investimentos'],
    latestSnapshot: {
      capturedAt: new Date(),
      viewCount: 200,
      likeCount: 1,
      commentCount: 0
    },
    previousSnapshot: {
      capturedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      viewCount: 190,
      likeCount: 1,
      commentCount: 0
    }
  });

  assert.equal(result.trendClassification, 'SATURADO');
  assert.equal(result.trendDirection, 'DOWN');
  assert.ok(result.trendScore < 35);
});
