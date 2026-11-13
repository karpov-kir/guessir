import { describe, expect, it, vi } from "vitest";

import { PubSub } from "./PubSub";

describe(PubSub, () => {
  it("should notify subscribers", () => {
    const pubSub = new PubSub();
    const mockedSubscriber1 = vi.fn<(data: unknown) => void>();
    const mockedSubscriber2 = vi.fn<(data: unknown) => void>();

    pubSub.event.subscribe(mockedSubscriber1);
    pubSub.event.subscribe(mockedSubscriber2);

    pubSub.publish("test");

    expect(mockedSubscriber1).toHaveBeenCalledWith("test");
    expect(mockedSubscriber1).toHaveBeenCalledTimes(1);
    expect(mockedSubscriber2).toHaveBeenCalledWith("test");
    expect(mockedSubscriber1).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if a subscriber is subscribed for the second time", () => {
    const pubSub = new PubSub();
    const mockedSubscriber = vi.fn<(data: unknown) => void>();

    pubSub.event.subscribe(mockedSubscriber);

    expect(() => pubSub.event.subscribe(mockedSubscriber)).toThrow(
      new Error("Provided subscriber is already subscribed"),
    );
  });

  it("should unsubscribe subscribers", () => {
    const pubSub = new PubSub();
    const mockedSubscriber1 = vi.fn<(data: unknown) => void>();
    const mockedSubscriber2 = vi.fn<(data: unknown) => void>();

    pubSub.event.subscribe(mockedSubscriber1);
    pubSub.event.subscribe(mockedSubscriber2);

    pubSub.event.unsubscribe(mockedSubscriber1);
    pubSub.event.unsubscribe(() => {
      void 0;
    });

    pubSub.publish("test");

    expect(mockedSubscriber1).not.toHaveBeenCalled();
    expect(mockedSubscriber2).toHaveBeenCalled();
  });

  it("should notify all subscribers even if a subscriber is unsubscribed during the notification process", () => {
    const pubSub = new PubSub();
    const mockedSubscriber1 = vi.fn<(data: unknown) => void>(() => {
      pubSub.event.unsubscribe(mockedSubscriber1);
    });
    const mockedSubscriber2 = vi.fn<(data: unknown) => void>();

    pubSub.event.subscribe(mockedSubscriber1);
    pubSub.event.subscribe(mockedSubscriber2);

    pubSub.publish("test");

    expect(mockedSubscriber1).toHaveBeenCalled();
    expect(mockedSubscriber2).toHaveBeenCalled();
  });
});
