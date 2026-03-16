import { HttpException, HttpStatus } from '@nestjs/common';
export declare class BusinessException extends HttpException {
    readonly errorCode: string;
    constructor(errorCode: string, message: string, statusCode?: HttpStatus);
}
