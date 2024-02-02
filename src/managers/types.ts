import { WalletModuleFactory } from '@near-wallet-selector/core'

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
  args: A
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
