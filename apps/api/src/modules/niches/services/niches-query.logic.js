function buildNicheListWhere(search) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ]
  };
}

function buildKeywordsByNicheWhere(nicheId, search) {
  return {
    nicheId,
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
  buildNicheListWhere,
  buildKeywordsByNicheWhere,
  buildPaginationMeta
};
