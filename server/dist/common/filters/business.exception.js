"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessException = void 0;
const common_1 = require("@nestjs/common");
class BusinessException extends common_1.HttpException {
    constructor(errorCode, message, statusCode = common_1.HttpStatus.BAD_REQUEST) {
        super({ errorCode, message }, statusCode);
        this.errorCode = errorCode;
    }
}
exports.BusinessException = BusinessException;
//# sourceMappingURL=business.exception.js.map