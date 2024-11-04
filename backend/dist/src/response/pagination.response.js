"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffsetPagination = void 0;
class OffsetPagination {
    constructor(total, totalFiltered, skip, take) {
        this._skip = 1;
        this._take = 10;
        this.maxTakes = 100;
        this.take = take || this.take;
        this.skip = skip || this.skip;
        this._total = total || 0;
        this._totalFiltered = totalFiltered || 0;
    }
    set skip(value) {
        this._skip = Math.max(value, 1);
    }
    get skip() {
        return this._skip;
    }
    set take(value) {
        this._take = value <= this.maxTakes ? value : this.maxTakes;
    }
    get take() {
        return this._take;
    }
    get total() {
        return this._total;
    }
    set totalFiltered(total) {
        this._totalFiltered = total;
    }
    get totalFiltered() {
        return this._totalFiltered;
    }
    hasNextPage() {
        return this.skip * this.take + this.take < this.total;
    }
    hasPreviousPage() {
        return this.skip > 0;
    }
    nextPage() {
        return this.skip + 1;
    }
    previousPage() {
        return this.skip > 0 ? this.skip - 1 : 0;
    }
    buildPage(content) {
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
    filterProps() {
        return {
            skip: (this.skip - 1) * this.take,
            take: this.take,
        };
    }
}
exports.OffsetPagination = OffsetPagination;
//# sourceMappingURL=pagination.response.js.map