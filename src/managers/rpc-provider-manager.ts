import { providers } from 'near-api-js'
import { RPCProviderManagerConfig } from './types'
import { FailoverRpcProvider } from 'near-api-js/lib/providers'

const NETWORK_ENDPOINTS = {
  mainnet: 'https://rpc.mainnet.near.org',
  testnet: 'https://rpc.testnet.near.org',
  localnet: 'http://localhost:3030',
}

class RPCProviderManager {
  private rpcNodeUrl?: RPCProviderManagerConfig['rpcNodeUrl']
  public provider: FailoverRpcProvider

  constructor({ rpcNodeUrl, fallbackRpcNodesUrls, network }: RPCProviderManagerConfig) {
    this.rpcNodeUrl = rpcNodeUrl

    let providersList = [new providers.JsonRpcProvider({ url: this.rpcNodeUrl ?? NETWORK_ENDPOINTS[network] })]

    if (fallbackRpcNodesUrls) {
      const fallbackProviders = fallbackRpcNodesUrls.map(
        (url) =>
          new providers.JsonRpcProvider(
            { url },
            {
              retries: 3, // Number of retries before giving up on a request
              backoff: 2, // Backoff factor for the retry delay
              wait: 500, // Wait time between retries in milliseconds
            }
          )
      )
      providersList = [...providersList, ...fallbackProviders]
    }

    this.provider = new FailoverRpcProvider(providersList)
  }
}

export default RPCProviderManager
