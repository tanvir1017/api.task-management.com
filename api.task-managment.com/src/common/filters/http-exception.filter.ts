import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObject = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (Array.isArray(responseObject.message)) {
          message = responseObject.message.join(', ');
        } else if (typeof responseObject.message === 'string') {
          message = responseObject.message;
        } else if (typeof responseObject.error === 'string') {
          message = responseObject.error;
        }
      }
    }

    const payload: ApiResponse<null> = {
      success: false,
      statusCode,
      message,
      data: null,
    };

    response.status(statusCode).json(payload);
  }
}
