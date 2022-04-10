import { Nft } from '../clients/interfaces/nft.interface';

export class NftUpdatedEvent {
  constructor(public readonly nft: Nft) {}
}
