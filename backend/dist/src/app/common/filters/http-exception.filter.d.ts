import { ExceptionFilter, ArgumentsHost, HttpException } from "@nestjs/common";
export declare class HttpExceptionFilter<T extends HttpException> implements ExceptionFilter {
    catch(exception: T, host: ArgumentsHost): void;
}
