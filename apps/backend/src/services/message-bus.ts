import { BaseDomainEvent } from '../events/domain-events';

export interface MessageBusProducer {
  publish<T>(event: BaseDomainEvent<T>): Promise<void>;
}

export interface MessageBusConsumer<T> {
  handle(event: BaseDomainEvent<T>): Promise<void>;
}

export class InMemoryMessageBus implements MessageBusProducer {
  private static readonly topics = new Map<string, Array<BaseDomainEvent<unknown>>>();

  async publish<T>(event: BaseDomainEvent<T>): Promise<void> {
    const topic = event.type;
    const current = InMemoryMessageBus.topics.get(topic) ?? [];
    current.push(event as BaseDomainEvent<unknown>);
    InMemoryMessageBus.topics.set(topic, current);
  }

  static consume<T>(topic: string, consumer: MessageBusConsumer<T>): Promise<void> {
    const events = InMemoryMessageBus.topics.get(topic) ?? [];
    return Promise.all(events.map((event) => consumer.handle(event as BaseDomainEvent<T>))).then(() => undefined);
  }
}

export class KafkaPublisher implements MessageBusProducer {
  async publish<T>(_event: BaseDomainEvent<T>): Promise<void> {
    // Production Kafka implementation placeholder.
    return Promise.resolve();
  }
}

export class RabbitMqPublisher implements MessageBusProducer {
  async publish<T>(_event: BaseDomainEvent<T>): Promise<void> {
    // Production RabbitMQ implementation placeholder.
    return Promise.resolve();
  }
}
