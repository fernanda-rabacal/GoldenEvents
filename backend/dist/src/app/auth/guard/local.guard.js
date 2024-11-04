"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAuthGuard = void 0;
const passport_1 = require("@nestjs/passport");
class LocalAuthGuard extends (0, passport_1.AuthGuard)('local') {
}
exports.LocalAuthGuard = LocalAuthGuard;
//# sourceMappingURL=local.guard.js.map