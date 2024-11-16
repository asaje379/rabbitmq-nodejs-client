import { Channel, ConsumeMessage } from 'amqplib';

export type RmqOptions = {
  persist?: boolean;
  type?: 'direct' | 'topic' | 'fanout';
};

export type EmitBody<T> = {
  action: string;
  payload: T;
  options?: RmqOptions;
};

export type RequestPayload<T> = {
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: T;
};

export type RequestBody<T> = {
  action: string;
  payload: RequestPayload<T>;
  options?: RmqOptions;
};

export type MessageProto<T> = {
  data?: T;
  error?: Error;
};

export type ListenerOptions = RmqOptions & {
  /**
   * If `asWorker` is set to true, channel.prefetch will be used.
   */
  asWorker?: boolean;

  /**
   * If `concurrency` is set, the concurrency value will be used as argument for channel.prefetch.
   * `concurrency` is ignored is `asWorker`is set to false
   */
  concurrency?: number;
};

export type SchedulerOptions<T, D> = {
  /**
   * The number of milliseconds to wait before execute the function
   */
  in?: number;

  /**
   * The function execution date
   */
  at?: Date | string | number;

  /**
   * The name of the pre-registered function to execute
   */
  fn: T;

  /**
   * The function args
   */
  args?: D;
};

export type ExecuteOptions<T> = {
  executeAt: Date;
  fn: string;
  args?: T;
  context?: { name: string; value: any };
};

export type ListenerCallbackOptions = {
  channel: Channel;
  msg: ConsumeMessage;
};

export type RunnerOptions<T> = {
  /**
   * Initial timeout value in milliseconds
   */
  initialTimeout?: number;

  /**
   * When setted to false, the function is called after the initial timeout
   */
  runBeforeFirstTimeout?: boolean;

  /**
   * The exponential backoff factor
   */
  backoffFactor?: number;

  /**
   * The maximum number of the function retry. Default setted to 100
   */
  maxAttempts?: number;

  /**
   * The name of the pre-registered function
   */
  fn: string;

  /**
   * The function args
   */
  args?: T;
};

export type SchedulerRegisterOptions = {
  /**
   * Unique name of the function
   */
  name: string;

  /**
   * The function value
   */
  fn: Function;
};
