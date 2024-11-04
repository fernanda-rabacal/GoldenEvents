"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const ConflictError_1 = require("../types/ConflictError");
let ConflictInterceptor = class ConflictInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, rxjs_1.catchError)(error => {
            if (error instanceof ConflictError_1.ConflictError) {
                throw new common_1.ConflictException(error.message);
            }
            throw error;
        }));
    }
};
exports.ConflictInterceptor = ConflictInterceptor;
exports.ConflictInterceptor = ConflictInterceptor = __decorate([
    (0, common_1.Injectable)()
], ConflictInterceptor);
//# sourceMappingURL=conflict.interceptor.js.map