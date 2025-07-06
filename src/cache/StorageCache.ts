import { CacheConstructor, CacheI, Data } from './types'

let isLocalStorageAccessible = true

if (process.env.NODE_ENV !== 'test') {
  try {
    // just try to read it
    window.localStorage
  } catch (error) {
    isLocalStorageAccessible = false
  }
}

/**
 * Storage Cache - Data is persisted using Local Storage
 */
class StorageCache implements CacheI {
  private expirationTime = 60 // Default is 1 minute

  /**
   * @param expirationTime - Expiration time in seconds. Will be used as default expiration time for all items if customExpirationTime is not provided.
   */
  constructor({ expirationTime }: CacheConstructor) {
    this.expirationTime = expirationTime || this.expirationTime
  }

  private prepareData(data: any, customExpirationTime?: number) {
    return {
      expiresAt: Date.now() + (customExpirationTime || this.expirationTime) * 1000,
      data,
    }
  }

  setItem<T>(key: string, value: T, customExpirationTime?: number) {
    return new Promise<void>((resolve) => {
      if (!isLocalStorageAccessible) {
        resolve()
        return
      }

      const data = this.prepareData(value, customExpirationTime)

      // persist data
      localStorage.setItem(key, JSON.stringify(data))
      resolve()
    })
  }

  getItem<T>(key: string) {
    return new Promise<T | null>((resolve) => {
      if (!isLocalStorageAccessible) {
        resolve(null)
        return
      }

      const cachedDataStr = localStorage.getItem(key)
      const cachedData = cachedDataStr ? (JSON.parse(cachedDataStr) as Data<T>) : null

      if (cachedData && Date.now() < cachedData.expiresAt) {
        // Use cached info
        resolve(cachedData.data)
        return
      }

      resolve(null)
    })
  }

  removeItem(key: string) {
    return new Promise<void>((resolve) => {
      if (!isLocalStorageAccessible) {
        resolve()
        return
      }

      localStorage.removeItem(key)
      resolve()
    })
  }

  cleanUp() {
    return new Promise<void>((resolve) => {
      if (!isLocalStorageAccessible) {
        resolve()
        return
      }

      const lsSize = localStorage.length
      for (let i = 0; i < lsSize; i++) {
        const key = localStorage.key(i)
        if (key?.includes('naxios::')) {
          // Get data and parse it
          const cachedDataStr = localStorage.getItem(key)
          const cachedData = cachedDataStr ? (JSON.parse(cachedDataStr) as Data<any>) : null

          // If expired, remove item from local storage
          if (cachedData && Date.now() > cachedData.expiresAt) {
            localStorage.removeItem(key)
          }
        }
      }

      resolve()
    })
  }
}

export default StorageCache
