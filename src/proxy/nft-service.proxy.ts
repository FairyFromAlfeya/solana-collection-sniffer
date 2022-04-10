import { Injectable } from '@nestjs/common';
import {
  CommonProto,
  SolanaCollectionSnifferProto,
} from '@fairyfromalfeya/fsociety-proto';
import { NftService } from '../manager/nft.service';
import { listNftsToProto, nftEntityToProto } from '../utils/convert.util';
import { map, Observable } from 'rxjs';

@Injectable()
export class NftServiceProxy {
  constructor(private readonly nftService: NftService) {}

  listNfts(
    pagination: CommonProto.PaginationRequest,
  ): Promise<SolanaCollectionSnifferProto.ListNftsResponse> {
    return this.nftService
      .listNfts(pagination)
      .then((response) => listNftsToProto(response, pagination));
  }

  streamUpdatedNfts(
    collection: string,
  ): Observable<SolanaCollectionSnifferProto.Nft> {
    return this.nftService
      .streamUpdatedNfts(collection)
      .pipe(map(nftEntityToProto));
  }
}
