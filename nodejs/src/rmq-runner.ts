import { RmqConnection } from './rmq-connection';
import { RmqScheduler } from './rmq-scheduler';
import { RunnerOptions, SchedulerRegisterOptions } from './rmq-typings';

type RmqRunnerConfig = {
  attempts: number;
  timeout: number;
  backoffFactor: number;
  maxAttempts: number;
};

export class RmqRunner {
  private scheduler: RmqScheduler | null = null;
  private static fns: Record<
    string,
    {
      fn: Function;
      config: RmqRunnerConfig;
      args: any;
    }
  > = {};

  constructor(connection: RmqConnection) {
    this.scheduler = new RmqScheduler(connection);
  }

  register({ name, fn }: SchedulerRegisterOptions) {
    RmqRunner.fns[name] = {
      fn,
      config: { attempts: 1, backoffFactor: 1, maxAttempts: 100, timeout: 0 },
      args: null,
    };
    this.scheduler?.register({
      name,
      fn: async ({ args, config }: { args: any; config: RmqRunnerConfig }) => {
        const func = RmqRunner.fns[name].fn;

        console.log({ func, args, config });
        try {
          if (func) {
            await func(args);
            return;
          }
        } catch (error) {
          this.innerRun(name, { args, config });
        }
      },
    });
  }

  cancel(name: string) {
    RmqScheduler.cancel(name);
    delete RmqRunner.fns[name];
  }

  private innerRun<T>(
    name: string,
    {
      args,
      config,
    }: {
      args: T;
      config: RmqRunnerConfig;
    },
  ) {
    config.attempts++;
    config.timeout = config.timeout * config.backoffFactor;
    if (config.attempts >= config.maxAttempts) {
      return;
    }

    console.log('inner-run', {
      config,
      in: config.timeout,
      fn: name,
      args,
    });

    setTimeout(() => {
      this.scheduler?.schedule({
        in: config.timeout,
        fn: name,
        args: { args, config },
      });
    }, 10);
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
    setTimeout(() => {
      this.innerRun(name, { args: options.args, config });
    }, 10);
  }
}
