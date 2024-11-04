"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_event_dto_1 = require("./create-event.dto");
class UpdateEventDto extends (0, swagger_1.PartialType)(create_event_dto_1.CreateEventDto) {
}
exports.UpdateEventDto = UpdateEventDto;
//# sourceMappingURL=update-event.dto.js.map