class DoublyLinkedListNode<K, V> {
  key: K;
  value: V;
  prev: DoublyLinkedListNode<K, V> | null;
  next: DoublyLinkedListNode<K, V> | null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, DoublyLinkedListNode<K, V>>;
  private head: DoublyLinkedListNode<K, V>;
  private tail: DoublyLinkedListNode<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = new DoublyLinkedListNode<K, V>(null as K, null as V);
    this.tail = new DoublyLinkedListNode<K, V>(null as K, null as V);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private removeNode(node: DoublyLinkedListNode<K, V>): void {
    const prev = node.prev!;
    const next = node.next!;
    prev.next = next;
    next.prev = prev;
  }

  private addNode(node: DoublyLinkedListNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private moveToHead(node: DoublyLinkedListNode<K, V>): void {
    this.removeNode(node);
    this.addNode(node);
  }

  private removeTail(): DoublyLinkedListNode<K, V> {
    const node = this.tail.prev!;
    this.removeNode(node);
    return node;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    this.moveToHead(node);
    return node.value;
  }

  put(key: K, value: V): void {
    const node = this.cache.get(key);

    if (node) {
      node.value = value;
      this.moveToHead(node);
    } else {
      const newNode = new DoublyLinkedListNode(key, value);
      this.cache.set(key, newNode);
      this.addNode(newNode);

      if (this.cache.size > this.capacity) {
        const tail = this.removeTail();
        this.cache.delete(tail.key);
      }
    }
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  size(): number {
    return this.cache.size;
  }

  isEmpty(): boolean {
    return this.cache.size === 0;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values()).map(node => node.value);
  }

  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries()).map(([key, node]) => [key, node.value]);
  }
}