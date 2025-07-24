import { QueueItem } from "../../../shared/types/queue.types";

export class PriorityQueue {
  private items: QueueItem[] = [];
  private maxRetries: number;
  private processingTimeout: number;

  constructor(
    config: { maxRetries?: number; processingTimeout?: number } = {}
  ) {
    this.maxRetries = config.maxRetries || 3;
    this.processingTimeout = config.processingTimeout || 30000;
  }

  get length(): number {
    return this.items.length;
  }

  enqueue(item: Omit<QueueItem, "timestamp" | "id" | "retries" | "status">) {
    const queueItem: QueueItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      retries: 0,
      status: "pending",
    };

    this.items.push(queueItem);
    this.sort();
    return queueItem.id;
  }

  dequeue(): QueueItem | undefined {
    this.handleStuckItems();
    const item = this.items.find(
      (i) =>
        i.status === "pending" ||
        (i.status === "failed" && i.retries < this.maxRetries)
    );

    if (item) {
      const wasFailed = item.status === "failed";
      item.status = "processing";
      item.timestamp = Date.now();
      if (wasFailed) {
        item.retries++;
      }
    }

    return item;
  }

  updateStatus(id: string, status: QueueItem["status"]) {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.status = status;
      item.timestamp = Date.now();
      this.sort();
    }
  }

  private handleStuckItems() {
    const now = Date.now();
    this.items = this.items.reduce((acc, item) => {
      if (
        item.status === "processing" &&
        now - item.timestamp > this.processingTimeout
      ) {
        if (item.retries < this.maxRetries) {
          acc.push({
            ...item,
            status: "pending",
            timestamp: now,
          });
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, [] as QueueItem[]);
  }

  private sort() {
    this.items.sort((a, b) => {
      const statusOrder = {
        pending: 3,
        failed: 2,
        processing: 1,
        completed: 0,
      };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[b.status] - statusOrder[a.status];
      }

      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      if (a.retries !== b.retries) {
        return a.retries - b.retries;
      }

      return a.timestamp - b.timestamp;
    });
  }
}
