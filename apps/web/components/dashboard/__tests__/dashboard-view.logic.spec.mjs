import test from 'node:test';
import assert from 'node:assert/strict';
import { countExploding, mapTopNichesToChartData } from '../dashboard-view.logic.js';

test('countExploding conta somente itens EXPLODINDO', () => {
  const count = countExploding([
    { trendClassification: 'EXPLODINDO' },
    { trendClassification: 'SUBINDO' },
    { trendClassification: 'EXPLODINDO' }
  ]);

  assert.equal(count, 2);
});

test('mapTopNichesToChartData limita e mapeia dados', () => {
  const data = mapTopNichesToChartData(
    [
      { name: 'A', metrics: { avgTrendScore: 10 } },
      { name: 'B', metrics: { avgTrendScore: 20 } },
      { name: 'C', metrics: { avgTrendScore: 30 } }
    ],
    2
  );

  assert.deepEqual(data, [
    { name: 'A', score: 10 },
    { name: 'B', score: 20 }
  ]);
});
