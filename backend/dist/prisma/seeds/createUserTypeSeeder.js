"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserTypes = void 0;
async function createUserTypes(prisma) {
    await prisma.userType.createMany({
        data: [{ name: 'Admin' }, { name: 'Usuário' }],
    });
}
exports.createUserTypes = createUserTypes;
//# sourceMappingURL=createUserTypeSeeder.js.map