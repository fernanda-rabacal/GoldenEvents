"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app/app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const conflict_interceptor_1 = require("./app/common/errors/interceptors/conflict.interceptor");
const database_interceptor_1 = require("./app/common/errors/interceptors/database.interceptor");
const unauthorized_interceptor_1 = require("./app/common/errors/interceptors/unauthorized.interceptor");
const not_found_interceptor_1 = require("./app/common/errors/interceptors/not-found.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    const docConfig = new swagger_1.DocumentBuilder()
        .setTitle('Golden Events API')
        .setDescription('Api para disponibilizar os serviços do golden events.')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, docConfig);
    swagger_1.SwaggerModule.setup('/docs', app, document);
    app.enableCors();
    app.useGlobalInterceptors(new conflict_interceptor_1.ConflictInterceptor(), new database_interceptor_1.DatabaseInterceptor(), new unauthorized_interceptor_1.UnauthorizedInterceptor(), new not_found_interceptor_1.NotFoundInterceptor());
    await app.listen(process.env.PORT || 8080);
}
bootstrap();
//# sourceMappingURL=main.js.map