import { WalletModuleFactory } from '@near-wallet-selector/core'

export type ViewMethodArgs<A> = {
  args: A
}
export type ChangeMethodArgs<A> = {
  args: A
  gas?: string
  deposit?: string
  callbackUrl?: string
}
export type Network = 'mainnet' | 'testnet' | 'localnet'
export type Config = {
  contractId: string
  network: Network
  walletSelectorModules?: WalletModuleFactory[]
  onInit?: () => void
}
