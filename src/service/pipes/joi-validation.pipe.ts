import {
  PipeTransform,
  Injectable,
  Logger,
  ArgumentMetadata,
} from '@nestjs/common';
import { ObjectSchema } from 'joi';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  private readonly logger = new Logger('JoiValidationPipe');

  constructor(
    private readonly schema: ObjectSchema,
    private readonly container?: string,
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      this.logger.log(`Validating value: ${JSON.stringify(value)}`);

      const result = this.schema.validate(
        this.container ? value[this.container] : value,
      );

      if (result.error) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: result.error.message,
        });
      }

      return this.container ? { [this.container]: result.value } : result.value;
    }

    return value;
  }
}
