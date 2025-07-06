export interface CacheI {
  setItem: <T>(key: string, value: T) => Promise<void>
  getItem: <T>(key: string) => Promise<T | null>
  removeItem: (key: string) => Promise<void>
  /**
   * Clean up cache: remove all expired items from cache (in memory or local storage)
   * @returns
   */
  cleanUp: () => Promise<void>
}

export interface Data<T> {
  expiresAt: number
  data: T
}

export interface CacheConstructor {
  /**
   * Expiration time in seconds. Will be used as default expiration time for all items if customExpirationTime is not provided.
   * After expiration, this is going to fetch real data instead of using cached data.
   */
  expirationTime?: number
}
