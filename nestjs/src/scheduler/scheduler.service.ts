import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { RmqConnection, RmqScheduler } from '@asaje/rabbitmq-node-client';
import {
  RMQ_SCHEDULER_PROCESS_KEY,
  RMQ_SCHEDULER_PROCESSOR_KEY,
} from './scheduler.constant';
import { InjectRmqConnector } from '../connector/connector.constants';

@Injectable()
export class RmqSchedulerService {
  private logger = new Logger(RmqSchedulerService.name);
  private scheduler: RmqScheduler;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    @InjectRmqConnector() private connector: RmqConnection,
  ) {
    this.scheduler = new RmqScheduler(this.connector);
  }

  async onModuleInit() {
    const providers = this.discoveryService.getProviders();

    for (const provider of providers) {
      if (!provider.metatype) continue;

      const queueName = this.reflector.get(
        RMQ_SCHEDULER_PROCESSOR_KEY,
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
            RMQ_SCHEDULER_PROCESS_KEY,
            instance[methodName],
          );
          if (actionName) {
            this.scheduler.register({
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

  schedule<T>(
    action: string,
    args: T,
    config: { in?: number; at?: string | number | Date },
  ) {
    this.scheduler.schedule({ fn: action, args, in: config.in, at: config.at });
  }
}
