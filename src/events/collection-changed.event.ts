import { Collection } from '../manager/entities/collection.entity';

export class CollectionChangedEvent {
  constructor(public readonly collection: Collection) {}
}
