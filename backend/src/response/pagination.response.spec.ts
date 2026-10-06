import { OffsetPagination } from './pagination.response.js';

const items = Array.from({ length: 25 }, (_, index) => index + 1);

function paginate(skip?: number, take?: number) {
  return new OffsetPagination(items.length, items.length, skip, take).paginate(items);
}

describe('OffsetPagination', () => {
  it('should return the first page when skip is 0', () => {
    const page = paginate(0, 10);

    expect(page.content).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(page.page).toBe(1);
    expect(page.skip).toBe(0);
    expect(page.take).toBe(10);
    expect(page.totalPages).toBe(3);
    expect(page.totalPageRecords).toBe(10);
    expect(page.hasNextPage).toBe(true);
    expect(page.hasPreviousPage).toBe(false);
    expect(page.nextPage).toBe(1);
    expect(page.previousPage).toBe(0);
  });

  it('should return a middle page', () => {
    const page = paginate(1, 10);

    expect(page.content).toStrictEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(page.page).toBe(2);
    expect(page.hasNextPage).toBe(true);
    expect(page.hasPreviousPage).toBe(true);
    expect(page.nextPage).toBe(2);
    expect(page.previousPage).toBe(0);
  });

  it('should return the last page without a next page', () => {
    const page = paginate(2, 10);

    expect(page.content).toStrictEqual([21, 22, 23, 24, 25]);
    expect(page.page).toBe(3);
    expect(page.totalPageRecords).toBe(5);
    expect(page.hasNextPage).toBe(false);
  });

  it('should not have a next page when the page ends exactly on the total', () => {
    const page = paginate(0, 25);

    expect(page.content).toHaveLength(25);
    expect(page.hasNextPage).toBe(false);
  });

  it('should use the defaults when skip and take are not informed', () => {
    const page = paginate();

    expect(page.skip).toBe(0);
    expect(page.take).toBe(10);
    expect(page.content).toHaveLength(10);
  });

  it('should limit take to 100 and skip to at least 0', () => {
    const page = paginate(-3, 500);

    expect(page.skip).toBe(0);
    expect(page.take).toBe(100);
    expect(page.content).toHaveLength(25);
  });

  it('should convert numeric strings received from the query', () => {
    const page = paginate('1' as unknown as number, '6' as unknown as number);

    expect(page.skip).toBe(1);
    expect(page.take).toBe(6);
    expect(page.content).toStrictEqual([7, 8, 9, 10, 11, 12]);
  });

  it('should return an empty page for an empty list', () => {
    const page = new OffsetPagination(0, 0, 0, 10).paginate([]);

    expect(page.content).toStrictEqual([]);
    expect(page.totalPages).toBe(0);
    expect(page.hasNextPage).toBe(false);
  });
});
