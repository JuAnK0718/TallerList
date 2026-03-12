class PrismaNode<T> {
  data: T;
  next: PrismaNode<T> | null = null;
  constructor(data: T) { this.data = data; }
}

export class VaultLinkedList<T> {
  private head: PrismaNode<T> | null = null;
  private _size: number = 0;

  get size(): number { return this._size; }

  append(data: T): void {
    const node = new PrismaNode(data);
    if (!this.head) { this.head = node; }
    else { let c = this.head; while (c.next) c = c.next; c.next = node; }
    this._size++;
  }

  removeAt(index: number): T | null {
    if (index < 0 || index >= this._size) return null;
    let removed: T;
    if (index === 0) { removed = this.head!.data; this.head = this.head!.next; }
    else {
      let c = this.head!;
      for (let i = 0; i < index - 1; i++) c = c.next!;
      removed = c.next!.data; c.next = c.next!.next;
    }
    this._size--; return removed;
  }

  get(index: number): T | null {
    if (index < 0 || index >= this._size) return null;
    let c = this.head;
    for (let i = 0; i < index; i++) c = c!.next;
    return c ? c.data : null;
  }

  find(predicate: (item: T) => boolean): T | null {
    let c = this.head;
    while (c) { if (predicate(c.data)) return c.data; c = c.next; }
    return null;
  }

  filter(predicate: (item: T) => boolean): VaultLinkedList<T> {
    const result = new VaultLinkedList<T>();
    let c = this.head;
    while (c) { if (predicate(c.data)) result.append(c.data); c = c.next; }
    return result;
  }

  toArray(): T[] {
    const arr: T[] = []; let c = this.head;
    while (c) { arr.push(c.data); c = c.next; }
    return arr;
  }

  isEmpty(): boolean { return this._size === 0; }
  clear(): void { this.head = null; this._size = 0; }

  forEach(callback: (item: T, index: number) => void): void {
    let c = this.head; let i = 0;
    while (c) { callback(c.data, i); c = c.next; i++; }
  }
}
