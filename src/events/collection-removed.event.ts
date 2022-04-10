import { Collection } from '../manager/entities/collection.entity';

export class CollectionRemovedEvent {
  constructor(public readonly collection: Collection) {}
}
