import { RmqConnection } from './rmq-connection';
import { RmqListener } from './rmq-listener';
import { ListenerCallbackOptions, ListenerOptions } from './rmq-typings';

export class RmqServiceListener {
  private listener: RmqListener | null = null;

  constructor(connection: RmqConnection) {
    this.listener = new RmqListener(connection);
  }

  use<T>(
    key: string,
    service: T,
    options: ListenerOptions = {
      persist: false,
      type: 'direct',
      asWorker: false,
    },
  ) {
    if (this.listener) {
      this.listener.on(
        key,
        (data, options?: ListenerCallbackOptions) => {
          const _service = service as any;

          if (data.action in _service) {
            const action = data.action as keyof T;

            return _service[action](data.payload as any, options);
          }
        },
        options,
      );
    }
  }

  listen<T>(key: string, service: T) {
    this.use(key, service, { persist: true, type: 'direct', asWorker: false });
  }

  execute<T>(key: string, service: T, concurrency = 1) {
    this.use(key, service, {
      persist: true,
      type: 'direct',
      asWorker: true,
      concurrency,
    });
  }

  broadcast<T>(key: string, service: T) {
    this.use(key, service, { persist: false, type: 'fanout' });
  }
}
