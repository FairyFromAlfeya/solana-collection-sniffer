import { Nft } from '../manager/interfaces/nft.interface';

export class NftChangedEvent {
  constructor(public readonly nft: Nft) {}
}
