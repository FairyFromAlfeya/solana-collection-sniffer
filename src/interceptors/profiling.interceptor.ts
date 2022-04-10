import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ProfilingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ProfilingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        this.logger.error(err);
        return throwError(err);
      }),
    );
  }
}
