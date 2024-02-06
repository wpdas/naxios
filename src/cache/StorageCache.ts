import { CacheConstructor, CacheI, Data } from './types'

let isLocalStorageAccessible = true

try {
  // just try to read it
  window.localStorage
} catch (error) {
  isLocalStorageAccessible = false
}

/**
 * Storage Cache - Data is persisted using Local Storage
 */
class StorageCache implements CacheI {
  private expirationTime = 60 // Default is 1 minute

  constructor({ expirationTime }: CacheConstructor) {
    this.expirationTime = expirationTime || this.expirationTime
  }

  private prepareData(data: any) {
    return {
      expiresAt: Date.now() + this.expirationTime * 1000,
      data,
    }
  }

  setItem<T>(key: string, value: T) {
    return new Promise<void>((resolve) => {
      if (!isLocalStorageAccessible) {
        resolve()
        return
      }

      const data = this.prepareData(value)

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
}

export default StorageCache
