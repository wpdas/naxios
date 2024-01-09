import { WalletModuleFactory } from '@near-wallet-selector/core'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import MyNearIconUrl from '@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png'
import ContractManager from './managers/contract-manager'
import WalletManager from './managers/wallet-manager'
import { Config, Network } from './managers/types'

class naxios {
  private contractId: string
  private network: Network
  private walletSelectorModules: WalletModuleFactory[] = [setupMyNearWallet({ iconUrl: MyNearIconUrl.src })]

  constructor(config: Config) {
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

/** Naxios API */
export default naxios
