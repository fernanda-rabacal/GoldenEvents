/**
 * There is no best way to perform pagination, it relies in each use case.
 *
 * @see cursor-pagination.ts
 * @see https://progressivecoder.com/nestjs-prisma-pagination-offset-vs-cursor-with-examples/
 * @author Pedro Papadópolis
 *
 * Pagination with offset technique.
 *
 * Pros
 * The primary advantage of offset pagination is that we can jump to any page immediately. In other words, we can directly jump 50 records and take 5 records to reach page 11 (considering that each page has 5 records).
 * Also, we can paginate the same set of data in any sort order. For example, we can skip any number of pages for a list of books depending on their publishYear. On the other hand, cursor pagination needs a unique sequential id for sorting.
 *
 * Cons
 * Offset pagination is not scalable. Even when we are specifying an offset (or skip), database engine still needs to traverse all the records. This gets slower as the number of records increase. Imagine the situation when there is a Facebook feed with thousands of possible items.
 * Offset pagination is not suitable for datasets that change frequently. The window of results may be inaccurate from time to time depending on the number of writes. This can lead to missing results or even duplicates.
 *
 * Due to these shortcomings, offset pagination use-case is ideal for small result sets. Also, it helps if the writes are not very frequent. Ideal example would be a blogging platform where we can filter posts by author and also paginate those results for easy consumption.
 */

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

export class OffsetPagination {
  protected _skip = 1;
  protected _take = 10;
  protected _total: number;
  protected _totalFiltered: number;
  private maxTakes = 100;

  constructor(total?: number, totalFiltered?: number, skip?: number, take?: number) {
    this.take = take || this.take;
    this.skip = skip || this.skip;
    this._total = total || 0;
    this._totalFiltered = totalFiltered || 0;
  }

  set skip(value: number) {
    this._skip = Math.max(value, 1);
  }

  get skip(): number {
    return this._skip;
  }

  set take(value: number) {
    this._take = value <= this.maxTakes ? value : this.maxTakes;
  }

  get take(): number {
    return this._take;
  }

  get total(): number {
    return this._total;
  }

  set totalFiltered(total: number) {
    this._totalFiltered = total;
  }

  get totalFiltered(): number {
    return this._totalFiltered;
  }

  protected hasNextPage(): boolean {
    return this.skip * this.take + this.take < this.total;
  }

  protected hasPreviousPage(): boolean {
    return this.skip > 0;
  }

  protected nextPage(): number {
    return this.skip + 1;
  }

  protected previousPage(): number {
    return this.skip > 0 ? this.skip - 1 : 0;
  }

  public buildPage<T>(content: T[]): Page<T> {
    const page = {
      page: (this.skip * this.take) / this.take,
      skip: this.skip,
      take: this.take,
      totalRecords: this.total,
      totalFiltered: this.totalFiltered,
      totalPages: Math.ceil(this.totalFiltered / this._take) || 0,
      totalPageRecords: content.length,
      hasNextPage: this.hasNextPage(),
      hasPreviousPage: this.hasPreviousPage(),
      nextPage: this.nextPage(),
      previousPage: this.previousPage(),
      content,
    };

    return page;
  }

  public filterProps() {
    return {
      skip: (this.skip - 1) * this.take,
      take: this.take,
    };
  }
}
