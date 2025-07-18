import MemoryCache from '../cache/MemoryCache'
import { WalletModuleFactory } from '@near-wallet-selector/core'
import WalletManager from './wallet-manager'
import StorageCache from '../cache/StorageCache'

export type ViewMethodArgs<A> = {
  args: A
}
export type ChangeMethodArgs<A> = {
  args: A
  gas?: string
  /**
   * yoctoⓃ amount
   */
  deposit?: string
  /**
   * A page to take the user to after a transaction succeeds.
   */
  callbackUrl?: string
}

/**
 * Transaction type with its props
 */
export type Transaction<A> = {
  receiverId?: string
  method: string
  args?: A
  gas?: string
  /**
   * yoctoⓃ amount
   */
  deposit?: string
}

export type Network = 'mainnet' | 'testnet' | 'localnet'

export type WalletManagerConfig = {
  contractId: string
  network: Network
  /**
   * A list of fallback RPC endpoint URls. List of RPC Providers: https://docs.near.org/api/rpc/providers
   */
  fallbackRpcNodesUrls?: string[]
  walletSelectorModules?: WalletModuleFactory[]
  onInit?: () => void
}

export type RPCProviderManagerConfig = {
  /**
   * A custom RPC endpoint URl.
   */
  rpcNodeUrl?: string
  /**
   * A list of fallback RPC endpoint URls. List of RPC Providers: https://docs.near.org/api/rpc/providers
   */
  fallbackRpcNodesUrls?: string[]
  network: Network
}

export type ContractManagerConfig = {
  /**
   * A custom RPC endpoint URl. List of RPC Providers: https://docs.near.org/api/rpc/providers
   */
  rpcNodeUrl?: string
  /**
   * A list of fallback RPC endpoint URls. List of RPC Providers: https://docs.near.org/api/rpc/providers
   */
  fallbackRpcNodesUrls?: string[]
  /**
   * A wallet manager instance.
   */
  walletManager: WalletManager
  contractId?: string
  cache?: MemoryCache | StorageCache
}

export type BuildViewInterfaceProps = {
  method: string
  args: any
  config?: BuildViewInterfaceConfig
}

export type BuildViewInterfaceConfig = {
  /**
   * Use cached data (if avaiable and not expired)?
   */
  useCache?: boolean
  /**
   * Expiration time in seconds. If not set, the default (set while calling contractApi) expiration time will be used.
   */
  expirationTime?: number
  /**
   * Tag to identify / differentiate the cache item
   */
  tag?: string

  /**
   * Call is in queued mode, so it will wait for the previous call to finish before executing the next one.
   * This is useful to wait previous call calling the same method to finish before executing the next one and
   * getting the cached data if available.
   */
  useQueue?: boolean
}

// Naxios Constructor
export type NaxiosConstructor = Pick<ContractManagerConfig, 'rpcNodeUrl' | 'fallbackRpcNodesUrls'> & {
  contractId: string
  network: Network
  // INFO: included since version 2.2.3 to support the new WalletModuleFactory<Type> type
  walletSelectorModules?: any[]
  // INFO: removed since version 2.2.3 (version 2.2.1 and 2.2.1 was using a different version of this WalletModuleFactory)
  // walletSelectorModules?: WalletModuleFactory[]
  // cache?: MemoryCache | StorageCache
  onInit?: () => void
}

export type ContractApi = {
  /**
   * Custom contract id. If not set, wallet's contract id (set during naxios instantiation) is going to be used
   */
  contractId?: string
  /**
   * Cache system
   */
  cache?: MemoryCache | StorageCache
}

export type WalletStatus = 'pending' | 'connecting' | 'ready'
