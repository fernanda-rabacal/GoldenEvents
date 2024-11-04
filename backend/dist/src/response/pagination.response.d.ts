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
export declare class OffsetPagination {
    protected _skip: number;
    protected _take: number;
    protected _total: number;
    protected _totalFiltered: number;
    private maxTakes;
    constructor(total?: number, totalFiltered?: number, skip?: number, take?: number);
    set skip(value: number);
    get skip(): number;
    set take(value: number);
    get take(): number;
    get total(): number;
    set totalFiltered(total: number);
    get totalFiltered(): number;
    protected hasNextPage(): boolean;
    protected hasPreviousPage(): boolean;
    protected nextPage(): number;
    protected previousPage(): number;
    buildPage<T>(content: T[]): Page<T>;
    filterProps(): {
        skip: number;
        take: number;
    };
}
