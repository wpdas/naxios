import { keyStores } from 'near-api-js'
import {
  Account,
  NetworkId,
  setupWalletSelector,
  Wallet,
  WalletModuleFactory,
  WalletSelector,
} from '@near-wallet-selector/core'
import { setupModal } from '@near-wallet-selector/modal-ui'
import { Config, Network } from './types'

const getTestnetConfig = () => ({
  networkId: 'testnet',
  keyStores: new keyStores.BrowserLocalStorageKeyStore('keyStores:testnet'),
})

const getMainnetConfig = () => ({
  networkId: 'mainnet',
  keyStores: new keyStores.BrowserLocalStorageKeyStore('keyStores:mainnet'),
})

export class WalletManager {
  // Default wallet selector modules
  private walletSelectorModules!: WalletModuleFactory[]
  contractId: string
  /**
   * Signed In Accounts
   */
  accounts: Account[] = []
  network!: Network
  walletSelector!: WalletSelector
  wallet!: Wallet | undefined

  constructor(config: Config) {
    this.contractId = config.contractId
    this.network = config.network

    if (config.walletSelectorModules) {
      this.walletSelectorModules = config.walletSelectorModules
    }

    this.initNear().then(() => {
      if (config.onInit) {
        config.onInit()
      }
    })
  }

  // Init Near => To be called when the website loads
  async initNear() {
    const nearConfig = this.network === 'mainnet' ? getMainnetConfig() : getTestnetConfig()

    // Initialize Wallet Selector
    const walletSelector = await setupWalletSelector({
      network: nearConfig.networkId as NetworkId,
      modules: this.walletSelectorModules,
    })
    this.walletSelector = walletSelector

    // Initialize Wallet
    if (walletSelector.isSignedIn()) {
      const wallet = await walletSelector.wallet()
      this.wallet = wallet

      const accounts = await wallet.getAccounts()
      this.accounts = accounts
    }
  }

  async signInModal() {
    if (!this.walletSelector) {
      await this.initNear()
    }

    const modal = setupModal(this.walletSelector!, {
      contractId: this.contractId,
      description: 'Please select a wallet to sign in.',
    })
    modal.show()
  }
}

export default WalletManager
