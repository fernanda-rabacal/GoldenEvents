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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("./repositories/user.repository");
const NotFoundError_1 = require("../common/errors/types/NotFoundError");
const pagination_response_1 = require("../../response/pagination.response");
let UserService = class UserService {
    constructor(repository) {
        this.repository = repository;
    }
    async create(createUserDto) {
        return this.repository.create(createUserDto);
    }
    async findAll() {
        const users = await this.repository.findAll();
        if (users.length == 0) {
            throw new common_1.HttpException([], common_1.HttpStatus.NO_CONTENT);
        }
        return users;
    }
    async findById(id) {
        const user = this.repository.findById(id);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('Usuário não encontrado.');
        }
        return user;
    }
    async findByEmail(email) {
        const user = this.repository.findByEmail(email);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('Usuário não encontrado.');
        }
        return user;
    }
    async getUserTypes() {
        const userTypes = await this.repository.getUserTypes();
        if (userTypes.length == 0) {
            throw new common_1.HttpException([], common_1.HttpStatus.NO_CONTENT);
        }
        return userTypes;
    }
    async update(userId, updateUserDto) {
        return this.repository.update(userId, updateUserDto);
    }
    async toggleActiveUser(id) {
        const user = await this.findById(id);
        if (!user)
            throw new NotFoundError_1.NotFoundError('Usuário não encontrado.');
        return this.repository.toggleActiveUser(id, !user.active);
    }
    async getUserTickets(userId, query) {
        const tickets = await this.repository.getUserTickets(userId);
        const totalRecords = tickets.length;
        const paginator = new pagination_response_1.OffsetPagination(totalRecords, totalRecords, query.skip, query.take);
        return paginator.buildPage(tickets.splice(query.skip * query.take, query.take));
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository])
], UserService);
//# sourceMappingURL=user.service.js.map