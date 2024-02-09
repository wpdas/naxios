import { StorageCache } from '../../cache'
import naxios from '../../naxios'
import '../setupTest'

describe('contractApi -> view method', () => {
  it("View contract's method", (done) => {
    const naxiosInstance = new naxios({
      contractId: 'social.near',
      network: 'mainnet',
    })

    const contractApi = naxiosInstance.contractApi()

    ;(async () => {
      try {
        const response: any = await contractApi.view('get', {
          args: { keys: ['wendersonpires.near/profile/**'] },
        })

        expect(Object.keys(response)[0]).toBe('wendersonpires.near')
        done()
      } catch (error) {
        done(error)
      }
    })()
  })

  it("Cached view contract's method", (done) => {
    const cache = new StorageCache({ expirationTime: 10 })

    const naxiosInstance = new naxios({
      contractId: 'social.near',
      network: 'mainnet',
    })

    const cacheKey = 'naxios::mainnet:social.near:get:keys-wendersonpires.near/profile/**'

    const contractApi = naxiosInstance.contractApi({ cache })

    ;(async () => {
      try {
        const response: any = await contractApi.view(
          'get',
          {
            args: { keys: ['wendersonpires.near/profile/**'] },
          },
          { useCache: true }
        )

        expect(Object.keys(response)[0]).toBe('wendersonpires.near')

        // Cached data must be the same as the response
        const cachedData = await cache.getItem(cacheKey)
        expect(cachedData).toStrictEqual(response)
        done()
      } catch (error) {
        done(error)
      }
    })()
  })
})
