import { GrpcMethod, GrpcService } from '@nestjs/microservices';
import {
  SolanaCollectionSnifferProto,
  CommonProto,
} from '@fairyfromalfeya/fsociety-proto';
import { UseInterceptors, UsePipes } from '@nestjs/common';
import {
  paginationRequestSchema,
  streamUpdatedNftsRequestSchema,
} from '../utils/validation.util';
import { JoiValidationPipe } from '../pipes/joi-validation.pipe';
import { NftServiceProxy } from '../proxy/nft-service.proxy';
import { ProfilingInterceptor } from '../interceptors/profiling.interceptor';
import { Observable } from 'rxjs';

@GrpcService()
@UseInterceptors(ProfilingInterceptor)
export class NftController {
  constructor(private readonly nftServiceProxy: NftServiceProxy) {}

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @UsePipes(new JoiValidationPipe(paginationRequestSchema))
  listNfts(
    request: CommonProto.PaginationRequest,
  ): Promise<SolanaCollectionSnifferProto.ListNftsResponse> {
    return this.nftServiceProxy.listNfts(request);
  }

  @GrpcMethod(
    SolanaCollectionSnifferProto.SOLANA_COLLECTION_SNIFFER_SERVICE_NAME,
  )
  @UsePipes(new JoiValidationPipe(streamUpdatedNftsRequestSchema))
  streamUpdatedNfts(
    request: SolanaCollectionSnifferProto.StreamUpdatedNftsRequest,
  ): Observable<SolanaCollectionSnifferProto.Nft> {
    return this.nftServiceProxy.streamUpdatedNfts(request.id);
  }
}
