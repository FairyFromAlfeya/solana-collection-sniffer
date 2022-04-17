import { Injectable } from '@nestjs/common';
import { CommonProto } from '@fairyfromalfeya/fsociety-proto';
import { Nft } from './interfaces/nft.interface';
import { CollectionService } from './collection.service';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SolanaService } from '../clients/solana.service';
import {
  filter,
  from,
  lastValueFrom,
  map,
  mergeMap,
  Observable,
  Subject,
  toArray,
} from 'rxjs';
import { OnEvent } from '@nestjs/event-emitter';
import { NftUpdatedEvent } from '../events/nft-updated.event';
import { Collection } from './entities/collection.entity';
import { NftStatus } from './interfaces/nft-status.interface';

@Injectable()
export class NftService {
  private readonly subject = new Subject<Nft>();

  constructor(
    private readonly collectionService: CollectionService,
    private readonly solanaService: SolanaService,
  ) {}

  listNfts(
    pagination: CommonProto.PaginationRequest,
  ): Promise<[Nft[], number]> {
    if (!pagination.filters?.collection) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `filters.collection is not specified`,
      });
    }

    return this.collectionService
      .getCollectionByIdOrThrow(pagination.filters.collection)
      .then((collection) =>
        this.aggregate(
          collection,
          collection.nfts.slice(
            pagination.pageSize * pagination.pageNumber,
            pagination.pageSize * (pagination.pageNumber + 1),
          ),
          collection.nfts.length,
        ),
      );
  }

  streamUpdatedNfts(collection: string): Observable<Nft> {
    return this.subject.pipe(filter((nft) => nft.collection.id === collection));
  }

  private aggregate(
    collection: Collection,
    ids: string[],
    total: number,
  ): Promise<[Nft[], number]> {
    return lastValueFrom(
      from(ids).pipe(
        mergeMap((id) => this.solanaService.get(id, collection.id), 15),
        toArray(),
        map((nfts) => [[...nfts], total]),
      ),
    );
  }

  @OnEvent('nft.updated')
  private handleNftUpdated(event: NftUpdatedEvent): void {
    this.subject.next(event.nft);

    if (
      event.nft.status === NftStatus.NFT_STATUS_LISTING &&
      (!event.nft.collection.floor ||
        event.nft.collection.floor > event.nft.price)
    ) {
      this.collectionService.updateCollection({
        id: event.nft.collection.id,
        floor: event.nft.price,
        floorNft: event.nft.mint,
      });
    }
  }
}
