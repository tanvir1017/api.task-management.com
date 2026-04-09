import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((handlerResponse) => {
        if (
          handlerResponse &&
          typeof handlerResponse === 'object' &&
          'success' in handlerResponse &&
          'statusCode' in handlerResponse &&
          'message' in handlerResponse &&
          'data' in handlerResponse
        ) {
          return handlerResponse as ApiResponse<unknown>;
        }

        const statusCode = response.statusCode;
        let message = 'Request successful';
        let data: unknown = handlerResponse ?? null;

        if (handlerResponse && typeof handlerResponse === 'object') {
          const candidate = handlerResponse as Record<string, unknown>;
          if (typeof candidate.message === 'string') {
            message = candidate.message;
            const { message: _message, ...rest } = candidate;
            data = Object.keys(rest).length > 0 ? rest : null;
          }
        }

        return {
          success: true,
          statusCode,
          message,
          data,
        };
      }),
    );
  }
}
