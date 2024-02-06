import { CacheConstructor, CacheI, Data } from './types'

let _memoryCache: Record<string, any> = {}

/**
 * Memory Cache - It get cleared when the app refreshes
 */
class MemoryCache implements CacheI {
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
      const updatedCache = { ..._memoryCache }
      updatedCache[key] = this.prepareData(value)
      _memoryCache = updatedCache
      resolve()
    })
  }

  getItem<T>(key: string) {
    return new Promise<T | null>((resolve) => {
      const item = (_memoryCache[key] as Data<T>) || null

      if (item && Date.now() < item.expiresAt) {
        // Use cached info
        resolve(item.data)
        return
      }
      resolve(null)
    })
  }

  removeItem(key: string) {
    return new Promise<void>((resolve) => {
      const updatedCache: Record<string, any> = {}
      Object.keys(_memoryCache).forEach((currentKey: any) => {
        if (key !== currentKey) {
          updatedCache[currentKey] = _memoryCache[currentKey]
        }
      })

      _memoryCache = updatedCache
      resolve()
    })
  }

  cleanUp() {
    return new Promise<void>((resolve) => {
      Object.keys(_memoryCache).forEach((key) => {
        const keyValueData = _memoryCache[key] as Data<any>

        // If expired, remove item from _memoryCache
        if (Date.now() > keyValueData.expiresAt) {
          delete _memoryCache[key]
        }
      })

      resolve()
    })
  }
}

export default MemoryCache
