import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Collection } from './entities/collection.entity';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CollectionCreatedEvent } from '../events/collection-created.event';
import { CollectionUpdatedEvent } from '../events/collection-updated.event';
import { CollectionRemovedEvent } from '../events/collection-removed.event';

@EventSubscriber()
export class CollectionSubscriber
  implements EntitySubscriberInterface<Collection>
{
  private readonly logger = new Logger('CollectionSubscriber');

  constructor(
    private readonly connection: Connection,
    private readonly eventEmitter: EventEmitter2,
  ) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return Collection;
  }

  afterInsert(event: InsertEvent<Collection>): void {
    this.logger.log(
      `Insert: ${event.entity.id} - ${event.entity.name} - ${event.entity.address}`,
    );

    this.eventEmitter.emit(
      'collection.created',
      new CollectionCreatedEvent(event.entity),
    );
  }

  afterUpdate(event: UpdateEvent<Collection>): void {
    this.logger.log(
      `Update: ${event.entity.id} - ${event.entity.name} - ${event.entity.address}`,
    );

    this.eventEmitter.emit(
      'collection.updated',
      new CollectionUpdatedEvent(event.entity),
    );
  }

  afterSoftRemove(event: RemoveEvent<Collection>): void {
    this.logger.log(
      `Remove: ${event.entity.id} - ${event.entity.name} - ${event.entity.address}`,
    );

    this.eventEmitter.emit(
      'collection.removed',
      new CollectionRemovedEvent(event.entity),
    );
  }
}
