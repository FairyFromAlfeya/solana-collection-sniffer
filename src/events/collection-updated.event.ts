import { Collection } from '../manager/entities/collection.entity';

export class CollectionUpdatedEvent {
  constructor(public readonly collection: Collection) {}
}
