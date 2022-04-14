import { Collection } from '../manager/entities/collection.entity';

export class CollectionOutdatedEvent {
  constructor(public readonly collection: Collection) {}
}
