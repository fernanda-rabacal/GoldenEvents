import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';

// O DeepMockProxy tenta inferir os parâmetros do método genérico `groupBy`
// de cada model, o que faz o TypeScript cair em uma referência circular
// nos tipos de `having` (AND/OR/NOT) do Prisma. Como os testes não usam
// `groupBy`, removemos ele do tipo do mock.
type WithoutGroupBy<T> = {
  [K in keyof T]: T[K] extends { groupBy: unknown }
    ? Omit<T[K], 'groupBy'>
    : T[K];
};

export type PrismaClientMock = DeepMockProxy<WithoutGroupBy<PrismaClient>>;
