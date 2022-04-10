import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

const logger = new Logger('Cacheable');

// Mutex
const lock = () => {
  const locked = {};
  const ee = new EventEmitter();
  ee.setMaxListeners(0);

  return {
    acquire: (key) =>
      new Promise<void>((resolve) => {
        if (!locked[key]) {
          locked[key] = true;
          return resolve();
        }

        const tryAcquire = (value) => {
          if (!locked[key]) {
            locked[key] = true;
            ee.removeListener(key, tryAcquire);
            return resolve(value);
          }
        };

        ee.on(key, tryAcquire);
      }),

    release: (key, value) => {
      Reflect.deleteProperty(locked, key);
      setImmediate(() => ee.emit(key, value));
    },
  };
};

export abstract class Cacheable<T, D> {
  private fetchLock = lock();

  // Set Local/Redis/Postgres cache
  protected abstract getCache(id: string): Promise<T | null>;
  protected abstract setCache(id: string, value: T): Promise<void>;

  // Get snapshot from another service
  protected abstract getValue(id: string, extra?: D): Promise<T>;

  // Get cached or request new value
  async get(id: string, extra?: D): Promise<T> {
    try {
      // Try get cache
      let value = await this.getCache(id);

      if (value == null) {
        value = (await this.fetchLock.acquire(id)) as any;

        try {
          if (value == null) {
            value = await this.getValue(id, extra);
            await this.setCache(id, value);
          }
        } finally {
          this.fetchLock.release(id, value);
        }
      }

      return value;
    } catch (e) {
      logger.error(e);
    }
  }
}
