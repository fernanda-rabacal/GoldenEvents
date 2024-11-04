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
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../db/prisma.service");
const crypt_1 = require("../../../util/crypt");
const user_entity_1 = require("../entities/user.entity");
let UserRepository = class UserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const user = this.prisma.user.create({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                password: await (0, crypt_1.encryptData)(createUserDto.password),
                document: createUserDto.document,
                user_type: {
                    connect: {
                        id: user_entity_1.UserTypeEnum.USER,
                    },
                },
            },
        });
        return user;
    }
    async findAll() {
        const users = await this.prisma.user.findMany({
            where: {
                active: true,
            },
        });
        const removePassword = users.map(user => {
            const { password, ...rest } = user;
            return rest;
        });
        return removePassword;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
            },
            include: {
                user_type: true,
            },
        });
        const { password, ...rest } = user;
        return rest;
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: email,
            },
            include: {
                user_type: true,
            },
        });
        return user;
    }
    async getUserTypes() {
        const userTypes = await this.prisma.userType.findMany();
        return userTypes;
    }
    async update(id, updateUserDto) {
        const data = {};
        if (updateUserDto.name)
            data.name = updateUserDto.name;
        if (updateUserDto.password)
            data.password = await (0, crypt_1.encryptData)(updateUserDto.password);
        if (updateUserDto.userTypeId) {
            data.user_type = {
                connect: {
                    id: updateUserDto.userTypeId,
                },
            };
        }
        const user = await this.prisma.user.update({
            data,
            where: {
                id,
            },
        });
        return user;
    }
    async toggleActiveUser(id, active) {
        return this.prisma.user.update({
            data: {
                active,
            },
            where: {
                id,
            },
        });
    }
    async getUserTickets(userId) {
        let tickets = [];
        const categories = await this.prisma.eventCategory.findMany();
        const resultData = await this.prisma.ticket.findMany({
            where: {
                user_id: userId,
            },
            include: {
                event: {
                    select: {
                        category_id: true,
                    },
                },
            },
        });
        for (const ticket of resultData) {
            const category = categories.find(ct => ct.id === ticket.event.category_id);
            const ticketAlreadyOnCount = tickets.find(item => item.event_id === ticket.event_id);
            if (ticketAlreadyOnCount) {
                tickets = tickets.map(item => {
                    if (item.event_id === ticketAlreadyOnCount.event_id)
                        item.quantity += 1;
                    return item;
                });
            }
            else {
                tickets.push({ ...ticket, category: category.name, quantity: 1 });
            }
        }
        return tickets;
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserRepository);
//# sourceMappingURL=user.repository.js.map