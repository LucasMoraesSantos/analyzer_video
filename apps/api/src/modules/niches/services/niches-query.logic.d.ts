export function buildNicheListWhere(search?: string): unknown;
export function buildKeywordsByNicheWhere(nicheId: string, search?: string): unknown;
export function buildPaginationMeta(total: number, page: number, pageSize: number): {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
