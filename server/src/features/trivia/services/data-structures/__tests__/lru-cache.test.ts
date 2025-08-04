import { LRUCache } from '../lru-cache';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  describe('put and get', () => {
    it('should store and retrieve values', () => {
      cache.put('a', 1);
      cache.put('b', 2);
      cache.put('c', 3);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    it('should evict least recently used item when capacity is exceeded', () => {
      cache.put('a', 1);
      cache.put('b', 2);
      cache.put('c', 3);
      cache.put('d', 4);

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should update access order on get', () => {
      cache.put('a', 1);
      cache.put('b', 2);
      cache.put('c', 3);

      cache.get('a'); // Move 'a' to most recently used
      cache.put('d', 4);

      expect(cache.get('b')).toBeUndefined(); // 'b' should be evicted
      expect(cache.get('a')).toBe(1);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should update value and access order on put', () => {
      cache.put('a', 1);
      cache.put('b', 2);
      cache.put('c', 3);

      cache.put('a', 4); // Update value and move to most recently used
      cache.put('d', 5);

      expect(cache.get('b')).toBeUndefined(); // 'b' should be evicted
      expect(cache.get('a')).toBe(4);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(5);
    });
  });

  describe('delete', () => {
    it('should remove item from cache', () => {
      cache.put('a', 1);
      cache.put('b', 2);

      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
    });

    it('should return false when deleting non-existent item', () => {
      expect(cache.delete('x')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      cache.put('a', 1);
      cache.put('b', 2);
      cache.put('c', 3);

      cache.clear();

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBeUndefined();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct number of items', () => {
      expect(cache.size()).toBe(0);

      cache.put('a', 1);
      expect(cache.size()).toBe(1);

      cache.put('b', 2);
      expect(cache.size()).toBe(2);

      cache.delete('a');
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty cache', () => {
      expect(cache.isEmpty()).toBe(true);
    });

    it('should return false for non-empty cache', () => {
      cache.put('a', 1);
      expect(cache.isEmpty()).toBe(false);
    });
  });

  describe('keys, values, and entries', () => {
    beforeEach(() => {
      cache.put('a', 1);
      cache.put('b', 2);
      cache.put('c', 3);
    });

    it('should return all keys', () => {
      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
    });

    it('should return all values', () => {
      const values = cache.values();
      expect(values).toHaveLength(3);
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
    });

    it('should return all entries', () => {
      const entries = cache.entries();
      expect(entries).toHaveLength(3);
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
      expect(entries).toContainEqual(['c', 3]);
    });
  });
});