import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Nft } from './interfaces/nft.interface';
import { NftStatus } from './interfaces/nft-status.interface';
import { CollectionService } from './collection.service';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Collection } from './entities/collection.entity';
import { CollectionChangedEvent } from '../events/collection-changed.event';
import {
  OrderDirection,
  PaginationRequest,
} from '@fairyfromalfeya/fsociety-proto/dist/common';
import { OnEvent } from '@nestjs/event-emitter';

@Processor('nft')
export class NftConsumer implements OnModuleInit {
  private readonly logger = new Logger('NftConsumer');
  private readonly collections = new Map<string, Collection>();

  constructor(private readonly collectionService: CollectionService) {}

  onModuleInit() {
    this.collectionService
      .listCollections({
        pageNumber: 0,
        pageSize: 100,
        orderBy: 'updatedAt',
        orderDirection: OrderDirection.ORDER_DIRECTION_DESCENDING,
      } as PaginationRequest)
      .then((result) => {
        result[0].forEach((collection) =>
          this.collections.set(collection.id, collection),
        );
      });
  }

  @Process()
  async updateNft({ id, data }: Job<Nft>): Promise<boolean> {
    this.logger.log(`Processing job ${id} for NFT ${data.mint}`);

    const collection = this.collections.get(data.collection.id);

    if (
      data.status === NftStatus.NFT_STATUS_LISTING &&
      (!collection.floor || collection.floor > data.price)
    ) {
      this.logger.log(
        `New ${data.collection.id} collection floor: ${data.mint} - ${data.price}`,
      );

      this.collectionService.updateCollection({
        id: data.collection.id,
        floor: data.price,
        floorNft: data.mint,
      });
    }

    return true;
  }

  @OnEvent('collection.created')
  private handleCollectionCreated(event: CollectionChangedEvent): void {
    this.collections.set(event.collection.id, event.collection);
  }

  @OnEvent('collection.updated')
  private handleCollectionUpdated(event: CollectionChangedEvent): void {
    this.collections.set(event.collection.id, event.collection);
  }

  @OnEvent('collection.removed')
  private handleCollectionRemoved(event: CollectionChangedEvent): void {
    this.collections.delete(event.collection.id);
  }
}
