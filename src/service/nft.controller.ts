import { GrpcMethod, GrpcService } from '@nestjs/microservices';
import {
  CommonProto,
  SolanaCollectionSnifferProto,
} from '@fairyfromalfeya/fsociety-proto';
import { UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import {
  paginationRequestSchema,
  streamUpdatedNftsRequestSchema,
} from '../utils/validation.util';
import { JoiValidationPipe } from './pipes/joi-validation.pipe';
import { NftServiceProxy } from '../proxy/nft-service.proxy';
import { ProfilingInterceptor } from './interceptors/profiling.interceptor';
import { Observable } from 'rxjs';
import { CollectionGuard, Status } from './guards/collection.guard';
import { CollectionStatus } from '../manager/interfaces/collection-status.interface';

@GrpcService()
@UseInterceptors(ProfilingInterceptor)
export class NftController {
  constructor(private readonly nftServiceProxy: NftServiceProxy) {}

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @Status(CollectionStatus.COLLECTION_STATUS_READY)
  @UsePipes(new JoiValidationPipe(paginationRequestSchema))
  @UseGuards(CollectionGuard)
  listNfts(
    request: CommonProto.PaginationRequest,
  ): Promise<SolanaCollectionSnifferProto.ListNftsResponse> {
    return this.nftServiceProxy.listNfts(request);
  }

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @Status(CollectionStatus.COLLECTION_STATUS_READY)
  @UsePipes(new JoiValidationPipe(streamUpdatedNftsRequestSchema))
  @UseGuards(CollectionGuard)
  streamUpdatedNfts(
    request: SolanaCollectionSnifferProto.StreamUpdatedNftsRequest,
  ): Observable<SolanaCollectionSnifferProto.Nft> {
    return this.nftServiceProxy.streamUpdatedNfts(request.collection);
  }
}
