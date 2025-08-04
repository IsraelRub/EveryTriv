import { CircularBuffer } from '../circular-buffer';

describe('CircularBuffer', () => {
  let buffer: CircularBuffer<number>;

  beforeEach(() => {
    buffer = new CircularBuffer<number>(3);
  });

  describe('constructor', () => {
    it('should throw error for invalid capacity', () => {
      expect(() => new CircularBuffer(0)).toThrow();
      expect(() => new CircularBuffer(-1)).toThrow();
    });
  });

  describe('push', () => {
    it('should add elements up to capacity', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it('should overwrite oldest elements when full', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.toArray()).toEqual([2, 3, 4]);
    });
  });

  describe('pop', () => {
    it('should return undefined for empty buffer', () => {
      expect(buffer.pop()).toBeUndefined();
    });

    it('should remove and return oldest element', () => {
      buffer.push(1);
      buffer.push(2);

      expect(buffer.pop()).toBe(1);
      expect(buffer.pop()).toBe(2);
      expect(buffer.pop()).toBeUndefined();
    });
  });

  describe('peek', () => {
    it('should return undefined for empty buffer', () => {
      expect(buffer.peek()).toBeUndefined();
    });

    it('should return oldest element without removing it', () => {
      buffer.push(1);
      buffer.push(2);

      expect(buffer.peek()).toBe(1);
      expect(buffer.peek()).toBe(1);
    });
  });

  describe('peekLast', () => {
    it('should return undefined for empty buffer', () => {
      expect(buffer.peekLast()).toBeUndefined();
    });

    it('should return newest element without removing it', () => {
      buffer.push(1);
      buffer.push(2);

      expect(buffer.peekLast()).toBe(2);
      expect(buffer.peekLast()).toBe(2);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty buffer', () => {
      expect(buffer.isEmpty()).toBe(true);
    });

    it('should return false for non-empty buffer', () => {
      buffer.push(1);
      expect(buffer.isEmpty()).toBe(false);
    });
  });

  describe('isFull', () => {
    it('should return true when buffer is full', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      expect(buffer.isFull()).toBe(true);
    });

    it('should return false when buffer is not full', () => {
      buffer.push(1);
      buffer.push(2);
      expect(buffer.isFull()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all elements', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      buffer.clear();

      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.toArray()).toEqual([]);
    });
  });

  describe('getSize and getCapacity', () => {
    it('should return correct size', () => {
      expect(buffer.getSize()).toBe(0);

      buffer.push(1);
      expect(buffer.getSize()).toBe(1);

      buffer.push(2);
      expect(buffer.getSize()).toBe(2);

      buffer.pop();
      expect(buffer.getSize()).toBe(1);
    });

    it('should return correct capacity', () => {
      expect(buffer.getCapacity()).toBe(3);
    });
  });

  describe('forEach', () => {
    it('should iterate over elements in order', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const result: number[] = [];
      buffer.forEach((item) => result.push(item));

      expect(result).toEqual([1, 2, 3]);
    });

    it('should provide correct indices', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const indices: number[] = [];
      buffer.forEach((_, index) => indices.push(index));

      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('find', () => {
    it('should find matching element', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.find(x => x === 2)).toBe(2);
      expect(buffer.find(x => x > 2)).toBe(3);
      expect(buffer.find(x => x < 0)).toBeUndefined();
    });
  });

  describe('filter', () => {
    it('should return elements matching predicate', () => {
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.filter(x => x > 1)).toEqual([2, 3]);
      expect(buffer.filter(x => x % 2 === 0)).toEqual([2]);
      expect(buffer.filter(x => x < 0)).toEqual([]);
    });
  });
});