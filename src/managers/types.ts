import MemoryCache from '../cache/MemoryCache'
import { WalletModuleFactory } from '@near-wallet-selector/core'
import WalletManager from './wallet-manager'
import StorageCache from '@lib/cache/StorageCache'

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
  walletSelectorModules?: WalletModuleFactory[]
  onInit?: () => void
}

export type RPCProviderManagerConfig = {
  /**
   * A custom RPC endpoint URl.
   */
  rpcNodeUrl?: string
  network: Network
}

export type ContractManagerConfig = {
  /**
   * A custom RPC endpoint URl.
   */
  rpcNodeUrl?: string
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
}

// Naxios Constructor
export type NaxiosConstructor = Pick<ContractManagerConfig, 'rpcNodeUrl'> & {
  contractId: string
  network: Network
  walletSelectorModules?: WalletModuleFactory[]
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
