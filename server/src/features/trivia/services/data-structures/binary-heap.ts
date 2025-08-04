export class BinaryHeap<T> {
  private heap: T[];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.heap = [];
    this.compare = compare;
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private getLeftChildIndex(index: number): number {
    return 2 * index + 1;
  }

  private getRightChildIndex(index: number): number {
    return 2 * index + 2;
  }

  private swap(index1: number, index2: number): void {
    const temp = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = temp;
  }

  private siftUp(index: number): void {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.compare(this.heap[parentIndex], this.heap[index]) <= 0) {
        break;
      }
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private siftDown(index: number): void {
    const size = this.heap.length;
    while (true) {
      let minIndex = index;
      const leftChild = this.getLeftChildIndex(index);
      const rightChild = this.getRightChildIndex(index);

      if (
        leftChild < size &&
        this.compare(this.heap[leftChild], this.heap[minIndex]) < 0
      ) {
        minIndex = leftChild;
      }

      if (
        rightChild < size &&
        this.compare(this.heap[rightChild], this.heap[minIndex]) < 0
      ) {
        minIndex = rightChild;
      }

      if (minIndex === index) {
        break;
      }

      this.swap(index, minIndex);
      index = minIndex;
    }
  }

  insert(value: T): void {
    this.heap.push(value);
    this.siftUp(this.heap.length - 1);
  }

  extractMin(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }

    const min = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }

    return min;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  clear(): void {
    this.heap = [];
  }

  toArray(): T[] {
    return [...this.heap];
  }
}