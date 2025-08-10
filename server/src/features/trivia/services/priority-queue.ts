import { Injectable, Logger } from '@nestjs/common';
import { PriorityQueue as DataStructuresPriorityQueue } from '@datastructures-js/priority-queue';
import { LRUCache } from 'lru-cache';
import { Trie } from './data-structures/trie';
import { CircularBuffer } from './data-structures/circular-buffer';
import { QueueItem, QueueStats } from '../types/trivia.types';

@Injectable()
export class PriorityQueue {
  private readonly logger = new Logger(PriorityQueue.name);
  private readonly heap: DataStructuresPriorityQueue<QueueItem>;
  private readonly cache: LRUCache<string, QueueItem>;
  private readonly topicTrie: Trie;
  private readonly recentQuestions: CircularBuffer<QueueItem>;
  private readonly maxCacheSize = 1000;
  private readonly maxRecentQuestions = 100;

  constructor() {
    // Initialize Priority Queue with custom comparison function
    this.heap = new DataStructuresPriorityQueue<QueueItem>((a, b) => {
      // Higher priority items should come first
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Reversed for max heap behavior
      }
      // If priorities are equal, older items should come first
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Initialize LRU Cache with options object
    this.cache = new LRUCache<string, QueueItem>({
      max: this.maxCacheSize,
    });

    // Initialize Trie for topic autocomplete
    this.topicTrie = new Trie();

    // Initialize Circular Buffer for recent questions
    this.recentQuestions = new CircularBuffer<QueueItem>(this.maxRecentQuestions);
  }

  enqueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'status'>): string {
    try {
      const id = this.generateId();
      const queueItem: QueueItem = {
        ...item,
        id,
        createdAt: new Date(),
        status: 'pending',
      };

      this.heap.enqueue(queueItem);
      this.cache.set(id, queueItem);
      this.topicTrie.insert(item.topic, item.priority);

      this.logger.debug(`Enqueued item with ID: ${id}`);
      return id;
    } catch (error) {
      this.logger.error('Error enqueueing item:', error);
      throw error;
    }
  }

  dequeue(): QueueItem | undefined {
    try {
      const item = this.heap.dequeue();
      if (item) {
        this.cache.delete(item.id);
        this.recentQuestions.push(item);
        this.logger.debug(`Dequeued item with ID: ${item.id}`);
      }
      return item || undefined;
    } catch (error) {
      this.logger.error('Error dequeuing item:', error);
      throw error;
    }
  }

  peek(): QueueItem | undefined {
    const item = this.heap.front();
    return item || undefined;
  }

  getItem(id: string): QueueItem | undefined {
    return this.cache.get(id);
  }

  updateStatus(id: string, status: QueueItem['status']): void {
    const item = this.cache.get(id);
    if (item) {
      item.status = status;
      this.cache.set(id, item);
      this.logger.debug(`Updated status of item ${id} to ${status}`);
    }
  }

  getStats(): QueueStats {
    const items = this.heap.toArray();
    return {
      totalItems: items.length,
      pendingItems: items.filter((item: QueueItem) => item.status === 'pending').length,
      processingItems: items.filter((item: QueueItem) => item.status === 'processing').length,
      completedItems: items.filter((item: QueueItem) => item.status === 'completed').length,
      failedItems: items.filter((item: QueueItem) => item.status === 'failed').length,
      averageWaitTime: this.calculateAverageWaitTime(items),
    };
  }

  getRecentQuestions(): QueueItem[] {
    return this.recentQuestions.toArray();
  }

  suggestTopics(prefix: string, limit: number = 10): Array<{ word: string; weight: number }> {
    return this.topicTrie.autocomplete(prefix, limit);
  }

  clear(): void {
    this.heap.clear();
    this.cache.clear();
    this.topicTrie.clear();
    this.recentQuestions.clear();
    this.logger.debug('Cleared all data structures');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private calculateAverageWaitTime(items: QueueItem[]): number {
    const completedItems = items.filter(item => item.status === 'completed');
    if (completedItems.length === 0) {
      return 0;
    }

    const totalWaitTime = completedItems.reduce((sum, item) => {
      const waitTime = new Date().getTime() - item.createdAt.getTime();
      return sum + waitTime;
    }, 0);

    return totalWaitTime / completedItems.length;
  }
}