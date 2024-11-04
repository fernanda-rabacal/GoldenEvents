"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const common_1 = require("@nestjs/common");
const event_service_1 = require("./event.service");
const create_event_dto_1 = require("./dto/create-event.dto");
const update_event_dto_1 = require("./dto/update-event.dto");
const query_event_dto_1 = require("./dto/query-event.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/guard/jwt.guard");
const message_response_1 = require("../../response/message.response");
const category_service_1 = require("./category.service");
const buy_ticket_dto_1 = require("./dto/buy-ticket.dto");
let EventController = class EventController {
    constructor(eventService, categoryService) {
        this.eventService = eventService;
        this.categoryService = categoryService;
    }
    async findAll(query) {
        return await this.eventService.findAll(query);
    }
    async findAllCategories() {
        return this.categoryService.findAll();
    }
    async findCategoryById(id) {
        return this.categoryService.findById(+id);
    }
    async findById(id) {
        return this.eventService.findById(id);
    }
    async findBySlug(slug) {
        return this.eventService.findBySlug(slug);
    }
    async create(req, createEventDto) {
        createEventDto.userId = req.user['id'];
        const event = await this.eventService.create(createEventDto);
        return new message_response_1.MessageResponse('Evento cadastrado com sucesso.', event);
    }
    async buyTicket(id, req, buyTicketDto) {
        buyTicketDto.userId = req.user['id'];
        buyTicketDto.eventId = id;
        await this.eventService.buyTicket(buyTicketDto);
        return new message_response_1.MessageResponse('Ingresso(s) comprado(s) com sucesso.');
    }
    async update(id, updateEventDto, req) {
        const userId = req.user['id'];
        const event = this.eventService.update(+id, userId, updateEventDto);
        return new message_response_1.MessageResponse('Evento atualizado com sucesso.', event);
    }
    async delete(id, req) {
        const userId = req.user['id'];
        return this.eventService.delete(+id, userId);
    }
};
exports.EventController = EventController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_event_dto_1.QueryEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('/categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventController.prototype, "findAllCategories", null);
__decorate([
    (0, common_1.Get)('/categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "findCategoryById", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('/slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('/:id/buy-ticket'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, buy_ticket_dto_1.BuyEventTicketDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "buyTicket", null);
__decorate([
    (0, common_1.Patch)('/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_event_dto_1.UpdateEventDto, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "delete", null);
exports.EventController = EventController = __decorate([
    (0, swagger_1.ApiTags)('Event'),
    (0, common_1.Controller)('/events'),
    __metadata("design:paramtypes", [event_service_1.EventService,
        category_service_1.CategoryService])
], EventController);
//# sourceMappingURL=event.controller.js.map