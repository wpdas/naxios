import { WalletModuleFactory } from '@near-wallet-selector/core'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import ContractManager from './managers/contract-manager'
import WalletManager from './managers/wallet-manager'
import { NaxiosConstructor, Network, ContractApi } from './managers/types'

class naxios {
  private contractId: string
  private network: Network
  private walletSelectorModules: WalletModuleFactory[] = [setupMyNearWallet()]
  private walletManager!: WalletManager

  constructor(config: NaxiosConstructor) {
    this.contractId = config.contractId
    this.network = config.network
    if (config.walletSelectorModules) {
      this.walletSelectorModules = config.walletSelectorModules
    }

    this.walletManager = new WalletManager({
      contractId: this.contractId,
      network: this.network,
      walletSelectorModules: this.walletSelectorModules,
      onInit: config.onInit,
    })
  }

  /**
   * Wallet API - Only one Wallet instance should be used at a time
   * @returns
   */
  walletApi() {
    return this.walletManager as Omit<typeof this.walletManager, 'changeWalletStatus' | 'status'>
  }

  /**
   * Contract API
   * @returns
   */
  contractApi(config?: ContractApi) {
    return new ContractManager({
      walletManager: this.walletManager,
      contractId: config?.contractId,
      cache: config?.cache,
    })
  }
}

/** Naxios API */
export default naxios
