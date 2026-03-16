import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from './business.exception';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
      this.logger.warn(`Business error: ${errorCode} - ${message}`);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        errorCode = (resp['errorCode'] as string) || this.getDefaultErrorCode(status);
        message = (resp['message'] as string) || exception.message;
        if (Array.isArray(resp['message'])) {
          message = (resp['message'] as string[]).join(', ');
          errorCode = 'VALIDATION_ERROR';
        }
      } else {
        errorCode = this.getDefaultErrorCode(status);
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = exception.message;
    }

    const body: ApiResponse<null> = {
      success: false,
      data: null,
      error: errorCode,
      message,
    };

    response.status(status).json(body);
  }

  private getDefaultErrorCode(status: number): string {
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
}
