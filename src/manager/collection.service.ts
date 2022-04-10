import { Injectable, Logger } from '@nestjs/common';
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
import { CollectionUpdatedEvent } from '../events/collection-updated.event';

@Injectable()
export class CollectionService {
  private readonly logger = new Logger('CollectionService');

  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    private readonly solanaService: SolanaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getCollectionByIdOrThrow(id: string): Promise<Collection> {
    return this.collectionRepository.findOneOrFail(id).catch(() => {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Collection ${id} does not exist`,
      });
    });
  }

  createCollection(collection: Collection): Promise<Collection> {
    return this.collectionRepository.save(collection).then((collection) => {
      this.eventEmitter.emit(
        'collection.created',
        new CollectionCreatedEvent(collection),
      );

      return collection;
    });
  }

  updateCollection(collection: Collection): Promise<Collection> {
    return this.getCollectionByIdOrThrow(collection.id)
      .then((old) => this.collectionRepository.save({ ...old, ...collection }))
      .then(() => this.getCollectionByIdOrThrow(collection.id))
      .then((collection) => {
        this.eventEmitter.emit(
          'collection.updated',
          new CollectionUpdatedEvent(collection),
        );

        return collection;
      });
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
  private async handleNftMinted(event: CollectionCreatedEvent): Promise<void> {
    this.logger.log(`Extracting NFTs for collection ${event.collection.id}`);

    return await this.solanaService
      .extractNftsAddressesFromCollection(event.collection.address)
      .then((nfts) => this.updateCollection({ ...event.collection, nfts }))
      .then((collection) =>
        this.logger.log(
          `Loaded ${collection.nfts.length} NFTs for collection ${event.collection.id}`,
        ),
      );
  }
}
