import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from './entities/collection.entity';
import { Repository } from 'typeorm';
import { CommonProto } from '@fairyfromalfeya/fsociety-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { orderDirectionToString } from '../utils/convert.util';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CollectionCreatedEvent } from '../events/collection-created.event';
import { SolanaService } from '../clients/solana.service';
import { CollectionStatus } from './interfaces/collection-status.interface';
import { CollectionOutdatedEvent } from '../events/collection-outdated.event';

@Injectable()
export class CollectionService implements OnModuleInit {
  private readonly logger = new Logger('CollectionService');

  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    private readonly solanaService: SolanaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.collectionRepository.findAndCount().then((result) => {
      this.logger.log(`Updating ${result[1]} collections from database`);

      result[0].forEach((collection) =>
        this.eventEmitter.emit(
          'collection.outdated',
          new CollectionOutdatedEvent(collection),
        ),
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

    return this.updateCollection({
      id: event.collection.id,
      status: CollectionStatus.COLLECTION_STATUS_LOADING_COLLECTION,
    })
      .then((collection) =>
        this.solanaService.extractNftsAddressesFromCollection(
          collection.address,
        ),
      )
      .then((nfts) =>
        this.updateCollection({
          ...event.collection,
          status: CollectionStatus.COLLECTION_STATUS_COLLECTION_LOADED,
          nfts,
        }),
      )
      .then((collection) => {
        this.logger.log(
          `Loaded ${collection.nfts.length} NFTs for collection ${event.collection.id}`,
        );

        this.eventEmitter.emit(
          'collection.outdated',
          new CollectionOutdatedEvent(collection),
        );
      });
  }
}
