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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const common_1 = require("@nestjs/common");
const categories_repository_1 = require("./repositories/categories.repository");
const events_repository_1 = require("./repositories/events.repository");
const NotFoundError_1 = require("../common/errors/types/NotFoundError");
const pagination_response_1 = require("../../response/pagination.response");
let EventService = class EventService {
    constructor(repository, categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }
    async create(createEventDto) {
        const category = this.categoryRepository.findById(createEventDto.categoryId);
        if (!category) {
            throw new NotFoundError_1.NotFoundError('Categoria não encontrada.');
        }
        return this.repository.create(createEventDto);
    }
    async findAll(query) {
        const events = await this.repository.findAll(query);
        const totalRecords = events.length;
        const paginator = new pagination_response_1.OffsetPagination(totalRecords, events.length, query.skip, query.take);
        return paginator.buildPage(events.splice(query.skip * query.take, query.take));
    }
    async findById(eventId) {
        const event = await this.repository.findById(eventId);
        if (!event) {
            throw new NotFoundError_1.NotFoundError('Evento não encontrado');
        }
        return event;
    }
    async findBySlug(slug) {
        const event = await this.repository.findBySlug(slug);
        if (!event) {
            throw new NotFoundError_1.NotFoundError('Evento não encontrado');
        }
        return event;
    }
    async buyTicket(buyEventTicket) {
        await this.findById(buyEventTicket.eventId);
        return this.repository.buyTicket(buyEventTicket);
    }
    async update(id, userId, updateEventDto) {
        const { user_id, capacity, quantity_left } = await this.findById(id);
        const ticketsPurchased = capacity - quantity_left;
        if (userId !== user_id) {
            throw new common_1.NotAcceptableException('Você não pode editar um evento que não é seu.');
        }
        if (ticketsPurchased > updateEventDto.capacity) {
            throw new common_1.NotAcceptableException('A capacidade do evento não pode ser menor do que a quantidade de ingressos já comprados.');
        }
        if (updateEventDto.startDateTime &&
            updateEventDto.endDateTime &&
            +updateEventDto.startDateTime > +updateEventDto.endDateTime) {
            throw new common_1.NotAcceptableException('A data final do evento não pode ser antes da data de início.');
        }
        return this.repository.update(id, updateEventDto);
    }
    async delete(id, userId) {
        const { user_id } = await this.findById(id);
        if (userId !== user_id) {
            throw new common_1.NotAcceptableException('Você não pode deletar um evento que não é seu.');
        }
        return this.repository.delete(id);
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_repository_1.EventRepository,
        categories_repository_1.CategoryRepository])
], EventService);
//# sourceMappingURL=event.service.js.map