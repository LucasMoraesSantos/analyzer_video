import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildKeywordsByNicheWhere,
  buildNicheListWhere,
  buildPaginationMeta
} from '../niches-query.logic.js';

test('buildNicheListWhere monta OR quando há busca', () => {
  const where = buildNicheListWhere('financas');

  assert.deepEqual(where, {
    OR: [
      { name: { contains: 'financas', mode: 'insensitive' } },
      { slug: { contains: 'financas', mode: 'insensitive' } }
    ]
  });
});

test('buildKeywordsByNicheWhere inclui nicheId e filtro opcional', () => {
  assert.deepEqual(buildKeywordsByNicheWhere('n1', undefined), { nicheId: 'n1' });
  assert.deepEqual(buildKeywordsByNicheWhere('n1', 'viral'), {
    nicheId: 'n1',
    term: { contains: 'viral', mode: 'insensitive' }
  });
});

test('buildPaginationMeta garante mínimo de 1 página', () => {
  assert.deepEqual(buildPaginationMeta(0, 1, 20), {
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1
  });
});
