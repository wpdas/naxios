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
export type Config = {
  contractId: string
  network: Network
  walletSelectorModules?: WalletModuleFactory[]
  onInit?: () => void
}

export type ContractManagerConfig = {
  walletManager: WalletManager
  onInit?: () => void
  cache?: MemoryCache | StorageCache
}

export type BuildViewInterfaceProps = {
  method: string
  args: {}
  config?: BuildViewInterfaceConfig
}

export type BuildViewInterfaceConfig = {
  /**
   * Use cached data (if avaiable and not expired)?
   */
  useCache?: boolean
}

// Naxios Constructor
export type NaxiosConstructor = {
  contractId: string
  network: Network
  walletSelectorModules?: WalletModuleFactory[]
  cache?: MemoryCache | StorageCache
}

export type GetContractApi = NaxiosConstructor
