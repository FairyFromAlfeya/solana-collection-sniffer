import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from './entities/collection.entity';
import { Repository } from 'typeorm';
import { CommonProto } from '@fairyfromalfeya/fsociety-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { orderDirectionToString } from '../utils/convert.util';
import { OnEvent } from '@nestjs/event-emitter';
import { CollectionCreatedEvent } from '../events/collection-created.event';
import { SolanaService } from '../clients/solana.service';
import { CollectionRemovedEvent } from '../events/collection-removed.event';

@Injectable()
export class CollectionService implements OnModuleInit {
  private readonly logger = new Logger('CollectionService');

  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    private readonly solanaService: SolanaService,
  ) {}

  onModuleInit() {
    this.collectionRepository.findAndCount().then((result) => {
      this.logger.log(`Updating ${result[1]} collections from database`);

      result[0].forEach((collection) =>
        this.updateCollection({ id: collection.id }),
      );
    });
  }

  getCollectionByIdOrThrow(id: string): Promise<Collection> {
    return this.collectionRepository.findOneOrFail(id).catch(() => {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Collection ${id} does not exist`,
      });
    });
  }

  createCollection(collection: Collection): Promise<Collection> {
    return this.collectionRepository.save(collection);
  }

  updateCollection(collection: Collection): Promise<Collection> {
    return this.getCollectionByIdOrThrow(collection.id)
      .then((old) => this.collectionRepository.save({ ...old, ...collection }))
      .then(() => this.getCollectionByIdOrThrow(collection.id));
  }

  removeCollection(collection: Collection): Promise<Collection> {
    return this.getCollectionByIdOrThrow(collection.id).then((old) =>
      this.collectionRepository.softRemove(old),
    );
  }

  listCollections(
    pagination: CommonProto.PaginationRequest,
  ): Promise<[Collection[], number]> {
    return this.collectionRepository.findAndCount({
      skip: pagination.pageSize * pagination.pageNumber,
      take: pagination.pageSize,
      order: {
        [pagination.orderBy]: orderDirectionToString(pagination.orderDirection),
      },
    });
  }

  @OnEvent('collection.created')
  private handleCollectionCreated(
    event: CollectionCreatedEvent,
  ): Promise<void> {
    this.logger.log(`Extracting NFTs for collection ${event.collection.id}`);

    return this.solanaService
      .extractNftsAddressesFromCollection(event.collection.address)
      .then((nfts) => this.updateCollection({ ...event.collection, nfts }))
      .then((collection) =>
        this.logger.log(
          `Loaded ${collection.nfts.length} NFTs for collection ${event.collection.id}`,
        ),
      );
  }

  @OnEvent('collection.removed')
  private handleCollectionRemoved(event: CollectionRemovedEvent): void {
    return event.collection.nfts.forEach((nft) =>
      this.solanaService.removeCache(nft),
    );
  }
}
