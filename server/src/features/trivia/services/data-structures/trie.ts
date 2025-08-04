class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  weight: number;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.weight = 0;
  }
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string, weight: number = 1): void {
    let current = this.root;
    const lowerWord = word.toLowerCase();

    for (const char of lowerWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    current.weight = weight;
  }

  search(word: string): boolean {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  private findNode(prefix: string): TrieNode | null {
    let current = this.root;
    const lowerPrefix = prefix.toLowerCase();

    for (const char of lowerPrefix) {
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }

    return current;
  }

  autocomplete(prefix: string, limit: number = 10): Array<{ word: string; weight: number }> {
    const node = this.findNode(prefix);
    if (!node) {
      return [];
    }

    const results: Array<{ word: string; weight: number }> = [];
    this.dfs(node, prefix.toLowerCase(), results);

    return results
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  private dfs(
    node: TrieNode,
    prefix: string,
    results: Array<{ word: string; weight: number }>
  ): void {
    if (node.isEndOfWord) {
      results.push({ word: prefix, weight: node.weight });
    }

    for (const [char, childNode] of node.children) {
      this.dfs(childNode, prefix + char, results);
    }
  }

  delete(word: string): boolean {
    return this.deleteRecursive(this.root, word.toLowerCase(), 0);
  }

  private deleteRecursive(node: TrieNode, word: string, depth: number): boolean {
    if (depth === word.length) {
      if (!node.isEndOfWord) {
        return false;
      }
      node.isEndOfWord = false;
      return node.children.size === 0;
    }

    const char = word[depth];
    const childNode = node.children.get(char);
    if (!childNode) {
      return false;
    }

    const shouldDeleteChild = this.deleteRecursive(childNode, word, depth + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }

  clear(): void {
    this.root = new TrieNode();
  }

  getAllWords(): string[] {
    const results: string[] = [];
    this.dfsAll(this.root, '', results);
    return results;
  }

  private dfsAll(node: TrieNode, prefix: string, results: string[]): void {
    if (node.isEndOfWord) {
      results.push(prefix);
    }

    for (const [char, childNode] of node.children) {
      this.dfsAll(childNode, prefix + char, results);
    }
  }
}