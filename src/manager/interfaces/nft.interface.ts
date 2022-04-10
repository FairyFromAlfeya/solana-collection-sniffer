import { NftStatus } from './nft-status.interface';
import { Collection } from '../entities/collection.entity';
import { Marketplace } from './marketplace.interface';

export interface Nft {
  collection: Collection;
  mint: string;
  price: number;
  rarity: number;
  owner: string;
  status: NftStatus;
  escrowAccount: string;
  tokenAccount: string;
  createdAt: string;
  marketplace: Marketplace;
}
