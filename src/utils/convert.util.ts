import {
  CommonProto,
  SolanaCollectionSnifferProto,
} from '@fairyfromalfeya/fsociety-proto';
import { Collection } from '../manager/entities/collection.entity';
import { Nft } from '../clients/interfaces/nft.interface';

export const collectionProtoToEntity = (
  collection: SolanaCollectionSnifferProto.Collection,
): Collection => ({
  id: collection.id,
  name: collection.name,
  address: collection.address,
  floor: collection.floor,
});

export const collectionEntityToProto = (
  collection: Collection,
): SolanaCollectionSnifferProto.Collection => ({
  id: collection.id,
  name: collection.name,
  address: collection.address,
  floor: collection.floor,
  createdAt: collection.createdAt,
  updatedAt: collection.updatedAt,
  removedAt: collection.removedAt,
});

export const nftEntityToProto = (
  nft: Nft,
): SolanaCollectionSnifferProto.Nft => ({
  collection: collectionEntityToProto(nft.collection),
  mint: nft.mint,
  price: nft.price,
  rarity: nft.rarity,
  owner: nft.owner,
  status: nft.status,
  createdAt: nft.createdAt,
});

export const listCollectionsToProto = (
  result: [Collection[], number],
  pagination: CommonProto.PaginationRequest,
): SolanaCollectionSnifferProto.ListCollectionsResponse => ({
  collections: result[0].map((claim) => collectionEntityToProto(claim)),
  pagination: {
    totalSize: result[1],
    nextPageNumber: hasNextPage(
      result[1],
      pagination.pageNumber,
      pagination.pageSize,
    )
      ? ++pagination.pageNumber
      : null,
  },
});

export const listNftsToProto = (
  result: [Nft[], number],
  pagination: CommonProto.PaginationRequest,
): SolanaCollectionSnifferProto.ListNftsResponse => ({
  nfts: result[0].map((nft) => nftEntityToProto(nft)),
  pagination: {
    totalSize: result[1],
    nextPageNumber: hasNextPage(
      result[1],
      pagination.pageNumber,
      pagination.pageSize,
    )
      ? ++pagination.pageNumber
      : null,
  },
});

export const hasNextPage = (
  total: number,
  page: number,
  size: number,
): boolean => total > (page + 1) * size;

export const orderDirectionToString = (
  direction: CommonProto.OrderDirection,
): 'ASC' | 'DESC' =>
  direction === CommonProto.OrderDirection.ORDER_DIRECTION_ASCENDING
    ? 'ASC'
    : 'DESC';

export const dateColumnTransformer = {
  from: (value: string | null) =>
    value ? new Date(value).toISOString() : value,
  to: (value: string | null) => (value ? new Date(value).toISOString() : value),
};
