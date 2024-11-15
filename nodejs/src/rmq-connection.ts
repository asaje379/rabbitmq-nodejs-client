import { connect, Connection } from 'amqplib';

export class RmqConnection {
  private static connection: Connection | null = null;
  private static isReady = false;

  async connect(url: string) {
    if (!RmqConnection.connection) {
      RmqConnection.connection = await connect(url);
    }
    RmqConnection.isReady = true;
    return RmqConnection.connection;
  }

  get instance() {
    return RmqConnection.connection;
  }

  async onMonted(cb: () => void | Promise<void>) {
    const interval = setInterval(async () => {
      if (RmqConnection.isReady) {
        clearInterval(interval);
        await cb();
      }
    }, 500);
  }
}
