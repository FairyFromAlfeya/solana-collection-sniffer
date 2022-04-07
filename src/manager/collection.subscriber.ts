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

@EventSubscriber()
export class CollectionSubscriber
  implements EntitySubscriberInterface<Collection>
{
  private readonly logger = new Logger('CollectionSubscriber');

  constructor(connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return Collection;
  }

  afterInsert(event: InsertEvent<Collection>): void {
    this.logger.log(`Insert: ${JSON.stringify(event.entity)}`);
  }

  afterUpdate(event: UpdateEvent<Collection>): void {
    this.logger.log(`Update: ${JSON.stringify(event.entity)}`);
  }

  afterSoftRemove(event: RemoveEvent<Collection>): void {
    this.logger.log(`Remove: ${JSON.stringify(event.entity)}`);
  }
}
