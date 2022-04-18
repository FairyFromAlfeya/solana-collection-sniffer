import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CommonProto,
  SolanaCollectionSnifferProto,
} from '@fairyfromalfeya/fsociety-proto';
import { SolanaService } from '../../clients/solana.service';
import { CollectionStatus } from '../../manager/interfaces/collection-status.interface';

export const Status = (status: CollectionStatus) =>
  SetMetadata('status', status);

@Injectable()
export class CollectionGuard implements CanActivate {
  private readonly logger = new Logger('CollectionGuard');

  constructor(
    private readonly reflector: Reflector,
    private readonly solanaService: SolanaService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Metadata
    const status = this.reflector.get<CollectionStatus>(
      'status',
      context.getHandler(),
    );

    // Request and deal data
    const request = context
      .switchToRpc()
      .getData<
        | SolanaCollectionSnifferProto.StreamUpdatedNftsRequest
        | CommonProto.PaginationRequest
      >();

    const collection = this.solanaService.getCollection(
      'collection' in request ? request.collection : request.filters.collection,
    );

    this.logger.log(
      `Collection status: ${collection.status}. Must be: ${status}`,
    );

    return collection.status === status;
  }
}
