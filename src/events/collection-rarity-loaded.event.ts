import { Collection } from '../manager/entities/collection.entity';

export class CollectionRarityLoadedEvent {
  constructor(public readonly collection: Collection) {}
}
