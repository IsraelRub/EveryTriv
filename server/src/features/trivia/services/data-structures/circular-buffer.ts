export class CircularBuffer<T> {
  private buffer: T[];
  private head: number;
  private tail: number;
  private size: number;
  private maxSize: number;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Buffer capacity must be greater than 0');
    }
    this.buffer = new Array<T>(capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
    this.maxSize = capacity;
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.maxSize;

    if (this.size < this.maxSize) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.maxSize;
    }
  }

  pop(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.maxSize;
    this.size--;
    return item;
  }

  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  peekLast(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const lastIndex = (this.tail - 1 + this.maxSize) % this.maxSize;
    return this.buffer[lastIndex];
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  isFull(): boolean {
    return this.size === this.maxSize;
  }

  clear(): void {
    this.buffer = new Array<T>(this.maxSize);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.maxSize;
  }

  toArray(): T[] {
    const result = new Array<T>(this.size);
    for (let i = 0; i < this.size; i++) {
      result[i] = this.buffer[(this.head + i) % this.maxSize];
    }
    return result;
  }

  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.size; i++) {
      callback(this.buffer[(this.head + i) % this.maxSize], i);
    }
  }

  find(predicate: (item: T) => boolean): T | undefined {
    for (let i = 0; i < this.size; i++) {
      const item = this.buffer[(this.head + i) % this.maxSize];
      if (predicate(item)) {
        return item;
      }
    }
    return undefined;
  }

  filter(predicate: (item: T) => boolean): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.buffer[(this.head + i) % this.maxSize];
      if (predicate(item)) {
        result.push(item);
      }
    }
    return result;
  }
}