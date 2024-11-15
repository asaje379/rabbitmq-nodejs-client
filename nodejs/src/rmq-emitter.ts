import { Channel, ConsumeMessage } from 'amqplib';
import { RmqConnection } from './rmq-connection';
import { EmitBody, RequestBody } from './rmq-typings';
import { nanoid } from 'nanoid';

export class RmqEmitter {
  private static channel: Channel | null = null;

  constructor(private connection: RmqConnection) {}

  async getChannel() {
    if (!RmqEmitter.channel && this.connection.instance) {
      RmqEmitter.channel = await this.connection.instance.createChannel();
    }
    return RmqEmitter.channel as Channel;
  }

  emit<T>(key: string, data: EmitBody<T>) {
    return new Promise((_, reject) => {
      const { options, ...args } = data;

      this.connection.onMonted(async () => {
        try {
          const channel = await this.getChannel();
          const exchange = `${key}_exchange`;
          channel.assertExchange(exchange, options?.type ?? 'direct', {
            durable: options?.persist ?? false,
          });
          channel.publish(exchange, key, Buffer.from(JSON.stringify(args)), {
            persistent: options?.persist ?? false,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  sendToWorker<T>(key: string, data: Omit<EmitBody<T>, 'options'>) {
    this.emit(key, { ...data, options: { persist: true, type: 'direct' } });
  }

  sendToTopic<T>(key: string, data: Omit<EmitBody<T>, 'options'>) {
    this.emit(key, { ...data, options: { type: 'topic' } });
  }

  request<T>(key: string, data: RequestBody<T>) {
    const { options, ...args } = data;
    const { persist = false, type = 'direct' } = options ?? {
      persist: false,
      type: 'direct',
    };
    return new Promise((resolve, reject) => {
      this.connection.onMonted(async () => {
        const channel = await this.getChannel();
        try {
          const exchange = `${key}_exchange`;
          channel.assertExchange(exchange, type, { durable: persist });

          const replyQueue = await channel.assertQueue('', { exclusive: true });
          const correlationId = nanoid();

          channel.consume(
            replyQueue.queue,
            (msg: ConsumeMessage | null) => {
              if (msg?.properties.correlationId === correlationId) {
                const response = JSON.parse(msg.content.toString());
                if (response.data) {
                  resolve(response.data);
                  return;
                }
                reject(response.error);
              }
            },
            { noAck: true },
          );

          channel.publish(exchange, key, Buffer.from(JSON.stringify(args)), {
            correlationId,
            replyTo: replyQueue.queue,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
