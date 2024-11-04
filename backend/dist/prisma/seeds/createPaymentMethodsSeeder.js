"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentMethods = void 0;
async function createPaymentMethods(prisma) {
    await prisma.paymentMethod.createMany({
        data: [{ name: 'Boleto' }, { name: 'Pix' }, { name: 'Cartão de Crédito' }],
    });
}
exports.createPaymentMethods = createPaymentMethods;
//# sourceMappingURL=createPaymentMethodsSeeder.js.map