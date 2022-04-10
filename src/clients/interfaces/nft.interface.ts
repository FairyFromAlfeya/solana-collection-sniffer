import { NftStatus } from './nft-status.interface';
import { Collection } from '../../manager/entities/collection.entity';

export interface Nft {
  collection: Collection;
  mint: string;
  price: number;
  rarity: number;
  owner: string;
  status: NftStatus;
  createdAt: string;
}
