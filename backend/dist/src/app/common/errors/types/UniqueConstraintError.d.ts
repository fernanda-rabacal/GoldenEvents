import { ConflictError } from './ConflictError';
import { PrismaClientError } from './PrismaClientError';
export declare class UniqueConstraintError extends ConflictError {
    constructor(e: PrismaClientError);
}
