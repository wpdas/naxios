import { WalletModuleFactory } from '@near-wallet-selector/core'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import ContractManager from './managers/contract-manager'
import WalletManager from './managers/wallet-manager'
import { Config, Network } from './managers/types'

class naxios {
  private contractId: string
  private network: Network
  private walletSelectorModules: WalletModuleFactory[] = [setupMyNearWallet()]

  constructor(config: Omit<Config, 'onInit'>) {
    this.contractId = config.contractId
    this.network = config.network
    if (config.walletSelectorModules) {
      this.walletSelectorModules = config.walletSelectorModules
    }
  }

  /**
   * Instantiate a new Contract api
   * @param onInit Method called when the api is ready
   * @returns
   */
  contractApi(onInit?: () => void) {
    return new ContractManager({ walletManager: this.walletApi(), onInit })
  }

  /**
   * Instantiate a new Wallet api
   * @param onInit Method called when the api is ready
   * @returns
   */
  walletApi(onInit?: () => void) {
    return new WalletManager({
      contractId: this.contractId,
      network: this.network,
      walletSelectorModules: this.walletSelectorModules,
      onInit,
    })
  }
}

/** Get a New Instant Contract API */
export const getContractApi = (config: Omit<Config, 'onInit'>) => {
  return new Promise<ContractManager>((resolve) => {
    const contractInstance = new naxios(config).contractApi(() => {
      resolve(contractInstance)
    })
  })
}

/** Get a New Instant Wallet API */
export const getWalletApi = (config: Omit<Config, 'onInit'>) => {
  return new Promise<WalletManager>((resolve) => {
    const walletInstance = new naxios(config).walletApi(() => {
      resolve(walletInstance)
    })
  })
}

/** Naxios API */
export default naxios
