import { Injectable } from '@nestjs/common';
import {
  CommonProto,
  SolanaCollectionSnifferProto,
} from '@fairyfromalfeya/fsociety-proto';
import { CollectionService } from '../manager/collection.service';
import {
  collectionEntityToProto,
  collectionProtoToEntity,
  listCollectionsToProto,
} from '../utils/convert.util';

@Injectable()
export class CollectionServiceProxy {
  constructor(private readonly collectionService: CollectionService) {}

  createCollection(
    collection: SolanaCollectionSnifferProto.Collection,
  ): Promise<SolanaCollectionSnifferProto.Collection> {
    return this.collectionService
      .createCollection(collectionProtoToEntity(collection))
      .then((collection) => collectionEntityToProto(collection));
  }

  updateCollection(
    collection: SolanaCollectionSnifferProto.Collection,
  ): Promise<SolanaCollectionSnifferProto.Collection> {
    return this.collectionService
      .updateCollection(collectionProtoToEntity(collection))
      .then((collection) => collectionEntityToProto(collection));
  }

  removeCollection(
    collection: SolanaCollectionSnifferProto.Collection,
  ): Promise<SolanaCollectionSnifferProto.Collection> {
    return this.collectionService
      .removeCollection(collectionProtoToEntity(collection))
      .then((collection) => collectionEntityToProto(collection));
  }

  listCollections(
    pagination: CommonProto.PaginationRequest,
  ): Promise<SolanaCollectionSnifferProto.ListCollectionsResponse> {
    return this.collectionService
      .listCollections(pagination)
      .then((response) => listCollectionsToProto(response, pagination));
  }
}
