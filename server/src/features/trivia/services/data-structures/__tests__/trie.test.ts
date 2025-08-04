import { Trie } from '../trie';

describe('Trie', () => {
  let trie: Trie;

  beforeEach(() => {
    trie = new Trie();
  });

  describe('insert and search', () => {
    it('should insert and find words', () => {
      trie.insert('hello');
      trie.insert('world');

      expect(trie.search('hello')).toBe(true);
      expect(trie.search('world')).toBe(true);
      expect(trie.search('hell')).toBe(false);
      expect(trie.search('worlds')).toBe(false);
    });

    it('should handle case-insensitive search', () => {
      trie.insert('Hello');
      trie.insert('WORLD');

      expect(trie.search('hello')).toBe(true);
      expect(trie.search('HELLO')).toBe(true);
      expect(trie.search('world')).toBe(true);
      expect(trie.search('World')).toBe(true);
    });

    it('should store weights', () => {
      trie.insert('hello', 5);
      trie.insert('world', 3);

      const results = trie.autocomplete('');
      expect(results).toContainEqual({ word: 'hello', weight: 5 });
      expect(results).toContainEqual({ word: 'world', weight: 3 });
    });
  });

  describe('autocomplete', () => {
    beforeEach(() => {
      trie.insert('hello', 1);
      trie.insert('help', 2);
      trie.insert('world', 3);
      trie.insert('word', 4);
      trie.insert('wonder', 5);
    });

    it('should return matching words with weights', () => {
      const results = trie.autocomplete('he');
      expect(results).toHaveLength(2);
      expect(results).toContainEqual({ word: 'help', weight: 2 });
      expect(results).toContainEqual({ word: 'hello', weight: 1 });
    });

    it('should return words sorted by weight', () => {
      const results = trie.autocomplete('w');
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ word: 'wonder', weight: 5 });
      expect(results[1]).toEqual({ word: 'word', weight: 4 });
      expect(results[2]).toEqual({ word: 'world', weight: 3 });
    });

    it('should handle case-insensitive prefix', () => {
      const results = trie.autocomplete('HE');
      expect(results).toHaveLength(2);
      expect(results).toContainEqual({ word: 'help', weight: 2 });
      expect(results).toContainEqual({ word: 'hello', weight: 1 });
    });

    it('should respect limit parameter', () => {
      const results = trie.autocomplete('w', 2);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ word: 'wonder', weight: 5 });
      expect(results[1]).toEqual({ word: 'word', weight: 4 });
    });

    it('should return empty array for non-matching prefix', () => {
      const results = trie.autocomplete('x');
      expect(results).toHaveLength(0);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      trie.insert('hello');
      trie.insert('help');
      trie.insert('world');
    });

    it('should delete existing words', () => {
      expect(trie.delete('hello')).toBe(true);
      expect(trie.search('hello')).toBe(false);
      expect(trie.search('help')).toBe(true);
    });

    it('should return false for non-existing words', () => {
      expect(trie.delete('hell')).toBe(false);
      expect(trie.delete('worlds')).toBe(false);
    });

    it('should handle case-insensitive delete', () => {
      expect(trie.delete('HELLO')).toBe(true);
      expect(trie.search('hello')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all words', () => {
      trie.insert('hello');
      trie.insert('world');

      trie.clear();

      expect(trie.search('hello')).toBe(false);
      expect(trie.search('world')).toBe(false);
      expect(trie.autocomplete('')).toHaveLength(0);
    });
  });

  describe('getAllWords', () => {
    it('should return all inserted words', () => {
      trie.insert('hello');
      trie.insert('help');
      trie.insert('world');

      const words = trie.getAllWords();
      expect(words).toHaveLength(3);
      expect(words).toContain('hello');
      expect(words).toContain('help');
      expect(words).toContain('world');
    });

    it('should return empty array for empty trie', () => {
      expect(trie.getAllWords()).toHaveLength(0);
    });
  });
});