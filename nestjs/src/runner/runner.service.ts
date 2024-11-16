import { RmqConnection, RmqRunner } from '@asaje/rabbitmq-node-client';
import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InjectRmqConnector } from '../connector';
import {
  RMQ_RUNNER_PROCESS_KEY,
  RMQ_RUNNER_PROCESSOR_KEY,
} from './runner.constant';

@Injectable()
export class RunnerService {
  private logger = new Logger(RunnerService.name);
  private runner: RmqRunner;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    @InjectRmqConnector() private connector: RmqConnection,
  ) {
    this.runner = new RmqRunner(this.connector);
  }

  async onModuleInit() {
    const providers = this.discoveryService.getProviders();

    for (const provider of providers) {
      if (!provider.metatype) continue;

      const queueName = this.reflector.get(
        RMQ_RUNNER_PROCESSOR_KEY,
        provider.metatype,
      );
      if (queueName) {
        this.logger.log('RmqScheduler service found');

        const instance = provider.instance;
        const methods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(instance),
        );

        for (const methodName of methods) {
          const actionName = this.reflector.get(
            RMQ_RUNNER_PROCESS_KEY,
            instance[methodName],
          );
          if (actionName) {
            this.runner.register({
              name: actionName,
              fn: instance[methodName].bind(instance),
            });
            this.logger.log(
              `${actionName} registered. ${methodName} will be used.`,
            );
          }
        }
      }
    }
  }

  execute<T>(
    action: string,
    args: T,
    config: {
      initialTimeout?: number;
      runBeforeFirstTimeout?: boolean;
      backoffFactor?: number;
      maxAttempts?: number;
    },
  ) {
    this.runner.run({ fn: action, args, ...config });
  }
}
