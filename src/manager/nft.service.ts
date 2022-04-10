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
import { CollectionUpdatedEvent } from '../events/collection-updated.event';
import { Collection } from './entities/collection.entity';

@Injectable()
export class NftService {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly solanaService: SolanaService,
  ) {}

  private subject = new Subject<Nft>();

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
        mergeMap((id) => this.solanaService.get(id, collection), 15),
        toArray(),
        map((nfts) => [[...nfts], total]),
      ),
    );
  }

  @OnEvent('nft.updated')
  private handleNftUpdated(event: NftUpdatedEvent): void {
    this.subject.next(event.nft);
  }

  @OnEvent('collection.updated')
  private async handleCollectionUpdated(
    event: CollectionUpdatedEvent,
  ): Promise<void> {
    await this.aggregate(
      event.collection,
      event.collection.nfts,
      event.collection.nfts.length,
    );
  }
}
