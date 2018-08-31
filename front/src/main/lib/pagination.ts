export interface PageRange {
  from: number
  to: number
  pageCount: number
}

export interface PageQuery {
  totalCount: number
  pageSize: number
  pageNumber: number
  dir: 'Asc' | 'Desc'
}

export function calculateRange({ totalCount, pageSize, pageNumber, dir }: PageQuery): PageRange {
  const pageCount = Math.ceil(totalCount / pageSize)
  const offset = pageSize * pageNumber
  if (dir === 'Asc') {
    const from = offset
    return { from, to: from + pageSize, pageCount }
  } else {
    const to = totalCount - offset
    return { from: Math.max(0, to - pageSize), to, pageCount }
  }
}
