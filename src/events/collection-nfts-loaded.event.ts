import { Collection } from '../manager/entities/collection.entity';

export class CollectionNftsLoadedEvent {
  constructor(public readonly collection: Collection) {}
}
