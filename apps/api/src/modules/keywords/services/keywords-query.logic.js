function buildKeywordListWhere({ nicheId, search }) {
  return {
    ...(nicheId ? { nicheId } : {}),
    ...(search ? { term: { contains: search, mode: 'insensitive' } } : {})
  };
}

function buildPaginationMeta(total, page, pageSize) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

module.exports = {
  buildKeywordListWhere,
  buildPaginationMeta
};
