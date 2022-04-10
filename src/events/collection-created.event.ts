import { Collection } from '../manager/entities/collection.entity';

export class CollectionCreatedEvent {
  constructor(public readonly collection: Collection) {}
}
