export function buildNicheListWhere(search) {
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

export function buildKeywordsByNicheWhere(nicheId, search) {
  return {
    nicheId,
    ...(search ? { term: { contains: search, mode: 'insensitive' } } : {})
  };
}

export function buildPaginationMeta(total, page, pageSize) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
