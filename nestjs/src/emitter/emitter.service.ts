import { Injectable, Logger } from '@nestjs/common';
import { InjectRmqConnector } from '../../connector/connector.constants';
import {
  EmitBody,
  RequestBody,
  RmqConnection,
  RmqEmitter,
} from '@ensfierte/rmq-connector';
import { RmqEmitOptions } from './emitter.typings';

@Injectable()
export class RmqEmitterService {
  private emitter: RmqEmitter;
  private logger = new Logger(RmqEmitterService.name);

  constructor(@InjectRmqConnector() private connector: RmqConnection) {
    this.emitter = new RmqEmitter(connector);
    this.logger.log('RmqEmitterService initialized successfully');
  }

  emit<T>(options: RmqEmitOptions<T>) {
    const { listener, ...data } = options;
    return this.emitter.emit(listener, data);
  }

  sendToWorker<T>(key: string, data: Omit<EmitBody<T>, 'options'>) {
    return this.emitter.sendToWorker(key, data);
  }

  sendToTopic<T>(key: string, data: Omit<EmitBody<T>, 'options'>) {
    return this.emitter.sendToTopic(key, data);
  }

  async request<T>(key: string, data: RequestBody<T>): Promise<unknown> {
    return this.emitter.request(key, data);
  }
}
