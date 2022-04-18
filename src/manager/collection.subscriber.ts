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
import { CollectionChangedEvent } from '../events/collection-changed.event';

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
      `Insert: ${event.entity.id} - ${event.entity.name} - ${event.entity.status}`,
    );

    this.eventEmitter.emit(
      'collection.created',
      new CollectionChangedEvent(event.entity),
    );
  }

  afterUpdate(event: UpdateEvent<Collection>): void {
    this.logger.log(
      `Update: ${event.entity.id} - ${event.entity.name} - ${event.entity.status}`,
    );

    this.eventEmitter.emit(
      'collection.updated',
      new CollectionChangedEvent(event.entity),
    );
  }

  afterSoftRemove(event: RemoveEvent<Collection>): void {
    this.logger.log(
      `Remove: ${event.entity.id} - ${event.entity.name} - ${event.entity.status}`,
    );

    this.eventEmitter.emit(
      'collection.removed',
      new CollectionChangedEvent(event.entity),
    );
  }
}
