export interface CacheI {
  setItem: <T>(key: string, value: T) => Promise<void>
  getItem: <T>(key: string) => Promise<T | null>
  removeItem: (key: string) => Promise<void>
}

export interface Data<T> {
  expiresAt: number
  data: T
}

export interface CacheConstructor {
  /**
   * Expiration time in seconds. After expiration, this is going to fetch real data instead of using cached data.
   */
  expirationTime?: number
}
