import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from './entities/collection.entity';
import { Repository } from 'typeorm';
import { CommonProto } from '@fairyfromalfeya/fsociety-proto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { orderDirectionToString } from '../utils/convert.util';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
  ) {}

  private getCollectionByIdOrThrow(id: string): Promise<Collection> {
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
}
