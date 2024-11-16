import { RmqConnection } from './rmq-connection';
import { RmqScheduler } from './rmq-scheduler';
import { RunnerOptions, SchedulerRegisterOptions } from './rmq-typings';

export class RmqRunner {
  private scheduler: RmqScheduler | null = null;
  private static fns: Record<
    string,
    {
      fn: Function;
      config: {
        attempts: number;
        timeout: number;
        backoffFactor: number;
        maxAttempts: number;
      };
    }
  > = {};

  constructor(connection: RmqConnection) {
    this.scheduler = new RmqScheduler(connection);
  }

  register({ name, fn }: SchedulerRegisterOptions) {
    RmqRunner.fns[name] = {
      fn,
      config: { attempts: 1, backoffFactor: 1, maxAttempts: 100, timeout: 0 },
    };
    this.scheduler?.register({
      name,
      fn: async () => {
        const func = RmqRunner.fns[name].fn;
        try {
          if (func) {
            await func();
            return;
          }
        } catch (error) {
          this.innerRun(name, {});
        }
      },
    });
  }

  cancel(name: string) {
    RmqScheduler.cancel(name);
    delete RmqRunner.fns[name];
  }

  private innerRun<T>(name: string, args: T) {
    const config = RmqRunner.fns[name].config;
    config.attempts++;
    config.timeout = config.timeout * config.backoffFactor;
    if (config.attempts >= config.maxAttempts) {
      return;
    }

    this.scheduler?.schedule({
      in: config.timeout,
      fn: name,
      args,
    });
  }

  async run<T>(options: RunnerOptions<T>) {
    const name = options.fn;
    const fn = RmqRunner.fns[name].fn;
    const config = RmqRunner.fns[name].config;

    config.attempts = 1;
    config.timeout = options.initialTimeout ?? 5000;
    config.backoffFactor = options.backoffFactor ?? 1;
    config.maxAttempts = options.maxAttempts ?? 100;

    const firstExecution = options.runBeforeFirstTimeout ?? true;

    if (firstExecution) {
      try {
        await fn(options.args);
        return;
      } catch (error) {}
    }
    this.innerRun(name, options.args);
  }
}
