"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueConstraintError = void 0;
const ConflictError_1 = require("./ConflictError");
class UniqueConstraintError extends ConflictError_1.ConflictError {
    constructor(e) {
        const uniqueField = e.meta.target;
        super(`Já existe um valor para o campo ${uniqueField}.`);
    }
}
exports.UniqueConstraintError = UniqueConstraintError;
//# sourceMappingURL=UniqueConstraintError.js.map