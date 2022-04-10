import { GrpcMethod, GrpcService } from '@nestjs/microservices';
import {
  SolanaCollectionSnifferProto,
  CommonProto,
} from '@fairyfromalfeya/fsociety-proto';
import { UseInterceptors, UsePipes } from '@nestjs/common';
import {
  createCollectionRequestSchema,
  updateCollectionRequestSchema,
  removeCollectionRequestSchema,
  paginationRequestSchema,
} from '../utils/validation.util';
import { JoiValidationPipe } from '../pipes/joi-validation.pipe';
import { CollectionServiceProxy } from '../proxy/collection-service.proxy';
import { ProfilingInterceptor } from '../interceptors/profiling.interceptor';

@GrpcService()
@UseInterceptors(ProfilingInterceptor)
export class CollectionController {
  constructor(
    private readonly collectionServiceProxy: CollectionServiceProxy,
  ) {}

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @UsePipes(new JoiValidationPipe(createCollectionRequestSchema))
  createCollection(
    request: SolanaCollectionSnifferProto.Collection,
  ): Promise<SolanaCollectionSnifferProto.Collection> {
    return this.collectionServiceProxy.createCollection(request);
  }

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @UsePipes(new JoiValidationPipe(updateCollectionRequestSchema))
  updateCollection(
    request: SolanaCollectionSnifferProto.Collection,
  ): Promise<SolanaCollectionSnifferProto.Collection> {
    return this.collectionServiceProxy.updateCollection(request);
  }

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @UsePipes(new JoiValidationPipe(removeCollectionRequestSchema))
  removeCollection(
    request: SolanaCollectionSnifferProto.Collection,
  ): Promise<SolanaCollectionSnifferProto.Collection> {
    return this.collectionServiceProxy.removeCollection(request);
  }

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @UsePipes(new JoiValidationPipe(paginationRequestSchema))
  listCollections(
    request: CommonProto.PaginationRequest,
  ): Promise<SolanaCollectionSnifferProto.ListCollectionsResponse> {
    return this.collectionServiceProxy.listCollections(request);
  }
}
