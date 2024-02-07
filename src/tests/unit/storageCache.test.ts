import { StorageCache } from '../../cache'
import '../setupTest'

describe('Storage Cache', () => {
  it('Store and read data', async () => {
    const memoryCache = new StorageCache({ expirationTime: 10 })
    const key = 'age'
    const age = 123
    await memoryCache.setItem(key, age)

    const restoredData = await memoryCache.getItem(key)
    expect(restoredData).toBe(age)
  })

  it('Data must be expired', async () => {
    const memoryCache = new StorageCache({ expirationTime: -1 })
    const key = 'name'
    const name = 'wenderson'
    await memoryCache.setItem(key, name)

    const restoredData = await memoryCache.getItem(key)
    expect(restoredData).toBe(null)
  })
})
