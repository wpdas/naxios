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
import { WalletManagerConfig, Network, WalletStatus } from './types'

const getTestnetConfig = () => ({
  networkId: 'testnet',
  keyStores: new keyStores.BrowserLocalStorageKeyStore('keyStores:testnet'),
})

const getMainnetConfig = () => ({
  networkId: 'mainnet',
  keyStores: new keyStores.BrowserLocalStorageKeyStore('keyStores:mainnet'),
})

const getLocalnetConfig = () => ({
  networkId: 'localnet',
  keyStores: new keyStores.BrowserLocalStorageKeyStore('keyStores:localnet'),
})

const configsList = { testnet: getTestnetConfig, mainnet: getMainnetConfig, localnet: getLocalnetConfig }

export class WalletManager {
  // Default wallet selector modules
  private walletSelectorModules!: WalletModuleFactory[]
  contractId: string
  /**
   * Signed In Accounts
   */
  accounts: Account[] = []
  /**
   * Main / First Signed In account id
   */
  accountId!: string | undefined
  network!: Network
  walletSelector!: WalletSelector
  wallet!: Wallet | undefined
  status: WalletStatus = 'pending'
  /**
   * Returns ID-s of 5 recently signed in wallets.
   */
  recentlySignedInWallets: string[] = []
  selectedWalletId: string | null = null

  constructor(config: WalletManagerConfig) {
    this.contractId = config.contractId
    this.network = config.network

    if (config.walletSelectorModules) {
      this.walletSelectorModules = config.walletSelectorModules
    }

    this.changeWalletStatus('pending')

    this.initNear().then(() => {
      if (config.onInit) {
        config.onInit()
      }
    })
  }

  changeWalletStatus(status: WalletStatus) {
    this.status = status
  }

  private async setupData() {
    // Initialize Wallet
    const wallet = await this.walletSelector.wallet()
    this.wallet = wallet

    const walletState = this.walletSelector.store.getState()
    const accounts = walletState.accounts
    this.accounts = accounts

    // Set main account Id
    this.accountId = accounts[0].accountId

    // Others
    this.recentlySignedInWallets = walletState.recentlySignedInWallets
    this.selectedWalletId = walletState.selectedWalletId
  }

  /**
   * Init Near. To be called when the website loads.
   * This is called automatically when there's any contract interaction.
   */
  async initNear() {
    const nearConfig = configsList[this.network]()

    // Initialize Wallet Selector
    const walletSelector = await setupWalletSelector({
      network: nearConfig.networkId as NetworkId,
      modules: this.walletSelectorModules,
    })
    this.walletSelector = walletSelector

    // Initialize Wallet
    if (walletSelector.isSignedIn()) {
      await this.setupData()
    } else {
      // Setup data on user sign in
      walletSelector.on('signedIn', this.setupData)
    }

    this.changeWalletStatus('ready')
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
