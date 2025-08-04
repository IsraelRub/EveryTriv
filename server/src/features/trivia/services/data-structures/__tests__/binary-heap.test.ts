import { BinaryHeap } from '../binary-heap';

describe('BinaryHeap', () => {
  let minHeap: BinaryHeap<number>;

  beforeEach(() => {
    minHeap = new BinaryHeap<number>((a, b) => a - b);
  });

  describe('insert', () => {
    it('should maintain min heap property', () => {
      minHeap.insert(5);
      minHeap.insert(3);
      minHeap.insert(7);
      minHeap.insert(1);

      expect(minHeap.peek()).toBe(1);
    });
  });

  describe('extractMin', () => {
    it('should return undefined for empty heap', () => {
      expect(minHeap.extractMin()).toBeUndefined();
    });

    it('should extract minimum element and maintain heap property', () => {
      minHeap.insert(5);
      minHeap.insert(3);
      minHeap.insert(7);
      minHeap.insert(1);

      expect(minHeap.extractMin()).toBe(1);
      expect(minHeap.extractMin()).toBe(3);
      expect(minHeap.extractMin()).toBe(5);
      expect(minHeap.extractMin()).toBe(7);
      expect(minHeap.extractMin()).toBeUndefined();
    });
  });

  describe('peek', () => {
    it('should return undefined for empty heap', () => {
      expect(minHeap.peek()).toBeUndefined();
    });

    it('should return minimum element without removing it', () => {
      minHeap.insert(5);
      minHeap.insert(3);
      minHeap.insert(7);

      expect(minHeap.peek()).toBe(3);
      expect(minHeap.peek()).toBe(3); // Should still be 3
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(minHeap.size()).toBe(0);

      minHeap.insert(5);
      expect(minHeap.size()).toBe(1);

      minHeap.insert(3);
      expect(minHeap.size()).toBe(2);

      minHeap.extractMin();
      expect(minHeap.size()).toBe(1);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty heap', () => {
      expect(minHeap.isEmpty()).toBe(true);
    });

    it('should return false for non-empty heap', () => {
      minHeap.insert(5);
      expect(minHeap.isEmpty()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all elements', () => {
      minHeap.insert(5);
      minHeap.insert(3);
      minHeap.insert(7);

      minHeap.clear();
      expect(minHeap.isEmpty()).toBe(true);
      expect(minHeap.size()).toBe(0);
      expect(minHeap.peek()).toBeUndefined();
    });
  });

  describe('toArray', () => {
    it('should return array representation of heap', () => {
      minHeap.insert(5);
      minHeap.insert(3);
      minHeap.insert(7);

      const array = minHeap.toArray();
      expect(array).toHaveLength(3);
      expect(array).toContain(3);
      expect(array).toContain(5);
      expect(array).toContain(7);
    });
  });

  describe('custom comparison', () => {
    it('should work with custom comparison function', () => {
      const maxHeap = new BinaryHeap<number>((a, b) => b - a);

      maxHeap.insert(5);
      maxHeap.insert(3);
      maxHeap.insert(7);
      maxHeap.insert(1);

      expect(maxHeap.extractMin()).toBe(7);
      expect(maxHeap.extractMin()).toBe(5);
      expect(maxHeap.extractMin()).toBe(3);
      expect(maxHeap.extractMin()).toBe(1);
    });

    it('should work with objects', () => {
      interface Task {
        priority: number;
        name: string;
      }

      const taskHeap = new BinaryHeap<Task>((a, b) => a.priority - b.priority);

      taskHeap.insert({ priority: 3, name: 'Medium' });
      taskHeap.insert({ priority: 1, name: 'High' });
      taskHeap.insert({ priority: 5, name: 'Low' });

      expect(taskHeap.extractMin()).toEqual({ priority: 1, name: 'High' });
      expect(taskHeap.extractMin()).toEqual({ priority: 3, name: 'Medium' });
      expect(taskHeap.extractMin()).toEqual({ priority: 5, name: 'Low' });
    });
  });
});