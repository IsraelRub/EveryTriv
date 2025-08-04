import { PriorityQueue } from '../priority-queue';
import { QueueItem } from '../../../../shared/types';

describe('PriorityQueue', () => {
  let queue: PriorityQueue;

  beforeEach(() => {
    queue = new PriorityQueue();
  });

  describe('enqueue', () => {
    it('should add items with correct properties', () => {
      const id = queue.enqueue({
        topic: 'test',
        difficulty: 'medium',
        priority: 1,
      });

      const item = queue.getItem(id);
      expect(item).toBeDefined();
      expect(item?.topic).toBe('test');
      expect(item?.difficulty).toBe('medium');
      expect(item?.priority).toBe(1);
      expect(item?.status).toBe('pending');
      expect(item?.createdAt).toBeInstanceOf(Date);
    });

    it('should maintain priority order', () => {
      const id1 = queue.enqueue({
        topic: 'test1',
        difficulty: 'medium',
        priority: 2,
      });

      const id2 = queue.enqueue({
        topic: 'test2',
        difficulty: 'medium',
        priority: 1,
      });

      const id3 = queue.enqueue({
        topic: 'test3',
        difficulty: 'medium',
        priority: 3,
      });

      expect(queue.dequeue()?.id).toBe(id2); // Priority 1
      expect(queue.dequeue()?.id).toBe(id1); // Priority 2
      expect(queue.dequeue()?.id).toBe(id3); // Priority 3
    });
  });

  describe('dequeue', () => {
    it('should return undefined for empty queue', () => {
      expect(queue.dequeue()).toBeUndefined();
    });

    it('should remove item from cache', () => {
      const id = queue.enqueue({
        topic: 'test',
        difficulty: 'medium',
        priority: 1,
      });

      const item = queue.dequeue();
      expect(item?.id).toBe(id);
      expect(queue.getItem(id)).toBeUndefined();
    });

    it('should add dequeued item to recent questions', () => {
      const id = queue.enqueue({
        topic: 'test',
        difficulty: 'medium',
        priority: 1,
      });

      queue.dequeue();
      const recentQuestions = queue.getRecentQuestions();
      expect(recentQuestions).toHaveLength(1);
      expect(recentQuestions[0].id).toBe(id);
    });
  });

  describe('updateStatus', () => {
    it('should update item status', () => {
      const id = queue.enqueue({
        topic: 'test',
        difficulty: 'medium',
        priority: 1,
      });

      queue.updateStatus(id, 'processing');
      expect(queue.getItem(id)?.status).toBe('processing');

      queue.updateStatus(id, 'completed');
      expect(queue.getItem(id)?.status).toBe('completed');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      queue.enqueue({
        topic: 'test1',
        difficulty: 'medium',
        priority: 1,
      });

      const id2 = queue.enqueue({
        topic: 'test2',
        difficulty: 'medium',
        priority: 2,
      });

      const id3 = queue.enqueue({
        topic: 'test3',
        difficulty: 'medium',
        priority: 3,
      });

      queue.updateStatus(id2, 'processing');
      queue.updateStatus(id3, 'completed');

      const stats = queue.getStats();
      expect(stats.totalItems).toBe(3);
      expect(stats.pendingItems).toBe(1);
      expect(stats.processingItems).toBe(1);
      expect(stats.completedItems).toBe(1);
      expect(stats.failedItems).toBe(0);
      expect(stats.averageWaitTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('suggestTopics', () => {
    beforeEach(() => {
      queue.enqueue({
        topic: 'science',
        difficulty: 'medium',
        priority: 3,
      });

      queue.enqueue({
        topic: 'scientific method',
        difficulty: 'hard',
        priority: 2,
      });

      queue.enqueue({
        topic: 'scientists',
        difficulty: 'easy',
        priority: 1,
      });
    });

    it('should return matching topics with weights', () => {
      const suggestions = queue.suggestTopics('sci');
      expect(suggestions).toHaveLength(3);
      suggestions.forEach(suggestion => {
        expect(suggestion.word.toLowerCase()).toContain('sci');
        expect(typeof suggestion.weight).toBe('number');
      });
    });

    it('should respect limit parameter', () => {
      const suggestions = queue.suggestTopics('sci', 2);
      expect(suggestions).toHaveLength(2);
    });

    it('should return empty array for non-matching prefix', () => {
      const suggestions = queue.suggestTopics('xyz');
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should remove all items and reset state', () => {
      queue.enqueue({
        topic: 'test1',
        difficulty: 'medium',
        priority: 1,
      });

      queue.enqueue({
        topic: 'test2',
        difficulty: 'medium',
        priority: 2,
      });

      queue.clear();

      expect(queue.dequeue()).toBeUndefined();
      expect(queue.getRecentQuestions()).toHaveLength(0);
      expect(queue.suggestTopics('')).toHaveLength(0);
      expect(queue.getStats().totalItems).toBe(0);
    });
  });
});