export interface PageResponse {
  pageStart: number;
  pageEnd: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pageResponse: PageResponse;
}
