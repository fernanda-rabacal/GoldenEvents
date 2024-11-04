"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventModule = void 0;
const common_1 = require("@nestjs/common");
const event_service_1 = require("./event.service");
const event_controller_1 = require("./event.controller");
const prisma_service_1 = require("../../db/prisma.service");
const category_service_1 = require("./category.service");
const events_repository_1 = require("./repositories/events.repository");
const categories_repository_1 = require("./repositories/categories.repository");
let EventModule = class EventModule {
};
exports.EventModule = EventModule;
exports.EventModule = EventModule = __decorate([
    (0, common_1.Module)({
        controllers: [event_controller_1.EventController],
        providers: [event_service_1.EventService, prisma_service_1.PrismaService, category_service_1.CategoryService, events_repository_1.EventRepository, categories_repository_1.CategoryRepository],
    })
], EventModule);
//# sourceMappingURL=event.module.js.map