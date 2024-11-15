import { Channel, ConsumeMessage } from 'amqplib';
import { RmqConnection } from './rmq-connection';
import { EmitBody, ListenerOptions, MessageProto } from './rmq-typings';

export class RmqListener {
  private static channel: Channel | null = null;

  constructor(private connection: RmqConnection) {}

  async getChannel() {
    if (!RmqListener.channel && this.connection.instance) {
      RmqListener.channel = await this.connection.instance.createChannel();
    }
    return RmqListener.channel as Channel;
  }

  on<T, Q>(
    key: string,
    cb: (data: EmitBody<T>) => Q,
    options: ListenerOptions = {
      persist: false,
      type: 'direct',
    },
  ) {
    this.connection.onMonted(async () => {
      const persist = options?.persist ?? false;

      const channel = await this.getChannel();
      const exchange = `${key}_exchange`;
      channel.assertExchange(exchange, options?.type ?? 'direct', {
        durable: persist,
      });

      const queueOptions = {
        exclusive: !persist,
        durable: persist,
        autoDelete: !persist,
      };

      const assertedQueue = await channel.assertQueue(
        persist ? key : '',
        queueOptions,
      );
      channel.bindQueue(assertedQueue.queue, exchange, key);

      channel.consume(
        assertedQueue.queue,
        async (msg: ConsumeMessage | null) => {
          if (msg) {
            const receivedData = JSON.parse(
              msg.content.toString(),
            ) as EmitBody<T>;

            const result: MessageProto<Q> = {};

            try {
              const response = (await cb(receivedData)) as Q;

              result.data = response;
            } catch (error: any) {
              result.error = error.message;
            } finally {
              if (msg.properties.replyTo) {
                channel.sendToQueue(
                  msg.properties.replyTo,
                  Buffer.from(JSON.stringify(result)),
                  { correlationId: msg.properties.correlationId },
                );
              }

              channel.ack(msg);
            }
          }
        },
        { noAck: false },
      );
    });
  }
}
