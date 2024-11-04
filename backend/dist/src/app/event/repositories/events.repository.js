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
exports.EventRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../db/prisma.service");
const slug_1 = require("../../../util/slug");
let EventRepository = class EventRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createEventDto) {
        const event = await this.prisma.event.create({
            data: {
                name: createEventDto.name,
                start_date: createEventDto.startDateTime,
                end_date: createEventDto.endDateTime,
                description: createEventDto.description,
                category_id: createEventDto.categoryId,
                user_id: createEventDto.userId,
                capacity: createEventDto.capacity,
                price: createEventDto.price,
                location: createEventDto.location,
                quantity_left: createEventDto.capacity,
                slug: (0, slug_1.generateSlug)(createEventDto.name),
            },
        });
        return event;
    }
    async findAll(query) {
        const events = await this.prisma.event.findMany({
            where: query.mountWhere(),
            include: {
                category: true,
            },
        });
        return events;
    }
    async findById(id) {
        return this.prisma.event.findFirst({
            where: {
                id,
            },
        });
    }
    async findBySlug(slug) {
        return this.prisma.event.findFirst({
            where: {
                slug,
            },
        });
    }
    async buyTicket(buyEventTicket) {
        const event = await this.findById(buyEventTicket.eventId);
        const tickets = Array.from({ length: buyEventTicket.quantity }, () => ({
            event_id: buyEventTicket.eventId,
            user_id: buyEventTicket.userId,
            payment_method_id: buyEventTicket.paymentMethodId,
            price: event.price,
        }));
        const purchasedTickets = await this.prisma.event.update({
            where: {
                id: event.id,
            },
            data: {
                quantity_left: event.quantity_left - buyEventTicket.quantity,
                tickets: {
                    createMany: {
                        data: tickets,
                    },
                },
            },
            include: {
                tickets: true,
            },
        });
        return purchasedTickets;
    }
    async update(id, updateEventDto) {
        const event = await this.prisma.event.update({
            where: {
                id: Number(id),
            },
            data: {
                name: updateEventDto.name,
                start_date: updateEventDto.startDateTime,
                description: updateEventDto.description,
                category_id: updateEventDto.categoryId,
                capacity: updateEventDto.capacity,
                price: updateEventDto.price,
                location: updateEventDto.location,
            },
        });
        return event;
    }
    async delete(id) {
        return this.prisma.event.update({
            data: {
                active: false,
            },
            where: {
                id: id,
            },
        });
    }
};
exports.EventRepository = EventRepository;
exports.EventRepository = EventRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventRepository);
//# sourceMappingURL=events.repository.js.map