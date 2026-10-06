export type Page<T> = {
  page: number;
  skip: number;
  take: number;
  totalRecords: number;
  totalFiltered: number;
  totalPages: number;
  totalPageRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  content: T[];
};
