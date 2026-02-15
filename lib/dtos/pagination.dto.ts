export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  last_page: number;
  total: number;
}

export type PaginatedResult<T> = PaginatedResponse<T>;
