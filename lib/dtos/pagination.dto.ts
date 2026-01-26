export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  lastPage: number;
  total: number;
}
