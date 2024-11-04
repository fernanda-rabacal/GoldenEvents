"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const createUserTypeSeeder_1 = require("./createUserTypeSeeder");
const createEventCategoriesSeeder_1 = require("./createEventCategoriesSeeder");
const createUsersSeeder_1 = require("./createUsersSeeder");
const createEventsSeeder_1 = require("./createEventsSeeder");
const createPaymentMethodsSeeder_1 = require("./createPaymentMethodsSeeder");
const prisma = new client_1.PrismaClient();
async function main() {
    await (0, createUserTypeSeeder_1.createUserTypes)(prisma);
    await (0, createEventCategoriesSeeder_1.createEventCategories)(prisma);
    await (0, createUsersSeeder_1.createUsers)(prisma);
    await (0, createEventsSeeder_1.createEvents)(prisma);
    await (0, createPaymentMethodsSeeder_1.createPaymentMethods)(prisma);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map