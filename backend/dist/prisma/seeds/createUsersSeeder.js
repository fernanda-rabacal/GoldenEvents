"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsers = void 0;
async function createUsers(prisma) {
    await prisma.user.createMany({
        data: [
            {
                name: 'Fernanda Rabaçal',
                user_type_id: 1,
                email: 'nandarabacal02@hotmail.com',
                password: '123456',
                document: '00000000000',
            },
            {
                name: 'Gabriel Mayan',
                user_type_id: 2,
                email: 'mayan@hotmail.com',
                password: '123456',
                document: '11122233344',
            },
        ],
    });
}
exports.createUsers = createUsers;
//# sourceMappingURL=createUsersSeeder.js.map