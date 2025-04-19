import { Injectable } from '@nestjs/common';

interface CacheItem {
  value: any;
  expiration: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheItem>();

  set(key: string, value: any, ttl: number): void {
    const expiration = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiration });
    setTimeout(() => this.cache.delete(key), ttl * 1000);
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    if (item.expiration < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  getWithDelete(key: string) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    this.cache.delete(key);
    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }
}
