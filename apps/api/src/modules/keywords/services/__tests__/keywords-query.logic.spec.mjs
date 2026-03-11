import test from 'node:test';
import assert from 'node:assert/strict';
import keywordsLogic from '../keywords-query.logic.js';

const { buildKeywordListWhere, buildPaginationMeta } = keywordsLogic;

test('buildKeywordListWhere monta filtros de nicheId e search', () => {
  assert.deepEqual(buildKeywordListWhere({ nicheId: undefined, search: undefined }), {});
  assert.deepEqual(buildKeywordListWhere({ nicheId: 'n1', search: undefined }), {
    nicheId: 'n1'
  });
  assert.deepEqual(buildKeywordListWhere({ nicheId: 'n1', search: 'hook' }), {
    nicheId: 'n1',
    term: { contains: 'hook', mode: 'insensitive' }
  });
});

test('buildPaginationMeta calcula totalPages', () => {
  assert.deepEqual(buildPaginationMeta(45, 2, 20), {
    total: 45,
    page: 2,
    pageSize: 20,
    totalPages: 3
  });
});
