import { WalletModuleFactory } from '@near-wallet-selector/core'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import ContractManager from './managers/contract-manager'
import WalletManager from './managers/wallet-manager'
import { NaxiosConstructor, Network, ContractApi } from './managers/types'
import { isClient } from './utils/isClient'

class naxios {
  private rpcNodeUrl?: ContractManager['rpcNodeUrl']
  private contractId: string
  private network: Network
  private walletSelectorModules: WalletModuleFactory[] = [setupMyNearWallet()]
  private walletManager!: WalletManager

  constructor(config: NaxiosConstructor) {
    this.rpcNodeUrl = config.rpcNodeUrl
    this.contractId = config.contractId
    this.network = config.network

    // Ensure it is going to run on client side only
    if (!isClient()) {
      return
    }

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
      rpcNodeUrl: this.rpcNodeUrl,
      walletManager: this.walletManager,
      contractId: config?.contractId,
      cache: config?.cache,
    })
  }
}

/** Naxios API */
export default naxios
