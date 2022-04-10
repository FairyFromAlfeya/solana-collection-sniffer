import { Nft } from '../manager/interfaces/nft.interface';

export class NftUpdatedEvent {
  constructor(public readonly nft: Nft) {}
}
