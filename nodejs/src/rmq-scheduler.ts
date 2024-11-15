import { RmqConnection } from './rmq-connection';
import { RmqEmitter } from './rmq-emitter';
import {
  ExecuteOptions,
  SchedulerOptions,
  SchedulerRegisterOptions,
} from './rmq-typings';
import { RmqServiceListener } from './rmq-service-listener';

const SCHEDULER_SERVICE_QUEUE_NAME = '__rmq_scheduler_service_queue__';

export class RmqScheduler {
  private listener: RmqServiceListener | null = null;
  private emitter: RmqEmitter | null = null;
  static fns: Record<string, Function> = {};

  constructor(connection: RmqConnection) {
    this.listener = new RmqServiceListener(connection);
    this.emitter = new RmqEmitter(connection);

    this.listener?.listen(SCHEDULER_SERVICE_QUEUE_NAME, {
      execute: async (data: ExecuteOptions<any>) => {
        await this.waitAndExecute(data);
      },
    });
  }

  register({ name, fn }: SchedulerRegisterOptions) {
    RmqScheduler.fns[name] = fn;
  }

  static cancel(name: string) {
    delete RmqScheduler.fns[name];
  }

  static getFnByName(name: string) {
    return RmqScheduler.fns[name];
  }

  private async waitAndExecute(data: ExecuteOptions<any>) {
    const remainingTime = new Date(data.executeAt).getTime() - Date.now();

    const fn = RmqScheduler.getFnByName(data.fn);

    if (!fn) {
      return;
    }

    if (remainingTime <= 0) {
      return await fn(data.args);
    }

    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(await fn(data.args));
      }, remainingTime);
    });
  }

  async schedule<T>(
    options: SchedulerOptions<keyof typeof RmqScheduler.fns, T>,
  ) {
    if (!options.in && !options.at) {
      throw new Error(
        'Invalid schedule options, `in` or `at` must be specified',
      );
    }

    let executeAt = new Date();
    if (options.in) {
      executeAt = new Date(Date.now() + options.in);
    }

    if (options.at) {
      executeAt = new Date(options.at);
    }

    setTimeout(() => {
      this.emitter?.emit(SCHEDULER_SERVICE_QUEUE_NAME, {
        action: 'execute',
        payload: {
          executeAt: executeAt.toISOString(),
          fn: options.fn,
          args: options.args,
        },
        options: { persist: true, type: 'direct' },
      });
    }, 100);
  }
}
