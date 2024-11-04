import { PrismaClientError } from '../types/PrismaClientError';
export declare enum PrismaErrors {
    UniqueConstraintFail = "P2002"
}
export declare const handleDatabaseErrors: (e: PrismaClientError) => Error;
