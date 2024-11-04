"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDatabaseErrors = exports.PrismaErrors = void 0;
const DatabaseError_1 = require("../types/DatabaseError");
const UniqueConstraintError_1 = require("../types/UniqueConstraintError");
var PrismaErrors;
(function (PrismaErrors) {
    PrismaErrors["UniqueConstraintFail"] = "P2002";
})(PrismaErrors || (exports.PrismaErrors = PrismaErrors = {}));
const handleDatabaseErrors = (e) => {
    switch (e.code) {
        case PrismaErrors.UniqueConstraintFail:
            return new UniqueConstraintError_1.UniqueConstraintError(e);
        default:
            return new DatabaseError_1.DatabaseError(e.message);
    }
};
exports.handleDatabaseErrors = handleDatabaseErrors;
//# sourceMappingURL=handle-database-errors.util.js.map