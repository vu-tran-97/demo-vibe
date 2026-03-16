"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const business_exception_1 = require("./business.exception");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        if (exception instanceof business_exception_1.BusinessException) {
            status = exception.getStatus();
            errorCode = exception.errorCode;
            message = exception.message;
            this.logger.warn(`Business error: ${errorCode} - ${message}`);
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse;
                errorCode = resp['errorCode'] || this.getDefaultErrorCode(status);
                message = resp['message'] || exception.message;
                if (Array.isArray(resp['message'])) {
                    message = resp['message'].join(', ');
                    errorCode = 'VALIDATION_ERROR';
                }
            }
            else {
                errorCode = this.getDefaultErrorCode(status);
                message = exception.message;
            }
        }
        else if (exception instanceof Error) {
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
            message = exception.message;
        }
        const body = {
            success: false,
            data: null,
            error: errorCode,
            message,
        };
        response.status(status).json(body);
    }
    getDefaultErrorCode(status) {
        switch (status) {
            case 400:
                return 'BAD_REQUEST';
            case 401:
                return 'UNAUTHORIZED';
            case 403:
                return 'FORBIDDEN';
            case 404:
                return 'NOT_FOUND';
            case 409:
                return 'CONFLICT';
            case 429:
                return 'RATE_LIMIT_EXCEEDED';
            default:
                return 'INTERNAL_ERROR';
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map