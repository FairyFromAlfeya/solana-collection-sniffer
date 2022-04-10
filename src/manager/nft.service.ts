import { Injectable } from '@nestjs/common';
import { CommonProto } from '@fairyfromalfeya/fsociety-proto';
import { Nft } from './interfaces/nft.interface';
import { CollectionService } from './collection.service';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SolanaService } from '../clients/solana.service';
import {
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
      .getCollectionByIdOrThrow(pagination.filters?.collection)
      .then((collection) =>
        this.aggregateNfts(
          collection.nfts.slice(
            pagination.pageSize * pagination.pageNumber,
            pagination.pageSize * (pagination.pageNumber + 1),
          ),
          collection.nfts.length,
        ),
      );
  }

  streamUpdatedNfts(collection: string): Observable<Nft> {
    return this.subject;
  }

  private aggregateNfts(
    ids: string[],
    total: number,
  ): Promise<[Nft[], number]> {
    return lastValueFrom(
      from(ids).pipe(
        mergeMap((id) => this.solanaService.get(id), 10),
        toArray(),
        map((nfts) => [[...nfts], total]),
      ),
    );
  }

  @OnEvent('nft.updated')
  private async handleNftUpdated(event: NftUpdatedEvent): Promise<void> {
    this.subject.next(event.nft);
  }

  @OnEvent('collection.updated')
  private async handleCollectionUpdated(
    event: CollectionUpdatedEvent,
  ): Promise<void> {
    await this.aggregateNfts(
      event.collection.nfts,
      event.collection.nfts.length,
    );
  }
}
