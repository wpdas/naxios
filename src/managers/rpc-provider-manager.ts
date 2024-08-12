import { providers } from 'near-api-js'
import { RPCProviderManagerConfig } from './types'

const NETWORK_ENDPOINTS = {
  mainnet: 'https://rpc.mainnet.near.org',
  testnet: 'https://rpc.testnet.near.org',
  localnet: 'http://localhost:3030',
}

class RPCProviderManager {
  private rpcNodeUrl?: RPCProviderManagerConfig['rpcNodeUrl']
  public provider: providers.JsonRpcProvider

  constructor({ rpcNodeUrl, network }: RPCProviderManagerConfig) {
    this.rpcNodeUrl = rpcNodeUrl
    this.provider = new providers.JsonRpcProvider({ url: this.rpcNodeUrl ?? NETWORK_ENDPOINTS[network] })
  }
}

export default RPCProviderManager
