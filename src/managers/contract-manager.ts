import { providers } from 'near-api-js'
import { Transaction as CoreTransaction } from '@near-wallet-selector/core'
import { NO_DEPOSIT, THIRTY_TGAS } from './constants'
import { QueryResponseKind } from 'near-api-js/lib/providers/provider'
import WalletManager from './wallet-manager'
import {
  BuildViewInterfaceConfig,
  BuildViewInterfaceProps,
  ChangeMethodArgs,
  ContractManagerConfig,
  Transaction,
  ViewMethodArgs,
} from './types'
import MemoryCache from '../cache/MemoryCache'
import StorageCache from '../cache/StorageCache'

type ResultType = QueryResponseKind & { result: any }

class ContractManager {
  private walletManager: WalletManager
  private cache?: MemoryCache | StorageCache

  constructor({ walletManager, cache, onInit }: ContractManagerConfig) {
    this.walletManager = walletManager
    this.cache = cache

    this.init().then(() => {
      if (onInit) {
        onInit()
      }
    })
  }

  private async init() {
    if (!this.walletManager.wallet) {
      await this.walletManager.initNear()
    }
  }

  /**
   * Create a key name based on contractId + method + args
   * @param method
   * @param args
   * @returns
   */
  private getCacheKey(method: string, args: Record<string, any>) {
    let keysValues = ''
    Object.keys(args || {}).forEach((key) => {
      keysValues += `:${key}-${args[key]}`
    })

    const key = `naxios::${this.walletManager.network}:${this.walletManager.contractId}:${method}${keysValues}`
    return key
  }

  // Build View Method Interface
  private async buildViewInterface<R>(props: BuildViewInterfaceProps) {
    // Clean up cache: remove all expired items from cache (in memory or local storage)
    if (this.cache) {
      await this.cache.cleanUp()
    }

    const { method = '', args = {}, config } = props
    const cacheKey = this.getCacheKey(method, args)

    // Check if there's cached information, if so, returns it
    // item name is composed of: naxios::testnet:contractAddress:method:arg0-arg0value:arg1-arg1value...
    if (config?.useCache && this.cache) {
      const cachedData = await this.cache.getItem<R>(cacheKey)

      if (cachedData) {
        return cachedData
      }
    }

    // If there's no cache, go forward...
    if (!this.walletManager.walletSelector) {
      await this.walletManager.initNear()
    }

    const { network } = this.walletManager.walletSelector.options
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl })

    const res = (await provider.query({
      request_type: 'call_function',
      account_id: this.walletManager.contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    })) as ResultType

    const outcome = JSON.parse(Buffer.from(res.result).toString()) as R

    // If cache is avaiable, store data on it
    if (config?.useCache && this.cache) {
      await this.cache.setItem<R>(cacheKey, outcome)
    }

    return outcome
  }

  // Build Call Method Interface
  private async buildCallInterface<R>({
    method = '',
    args = {},
    gas = THIRTY_TGAS,
    deposit = NO_DEPOSIT,
    callbackUrl = '',
  }) {
    if (!this.walletManager.walletSelector) {
      await this.walletManager.initNear()
    }

    // Check if wallet is connected
    if (!this.walletManager.walletSelector.isSignedIn()) {
      return Promise.reject({ error: 'No wallet connected' })
    }

    const { accountId } = this.walletManager.accounts[0]

    // Sign a transaction with the "FunctionCall" action
    const outcome = await this.walletManager.wallet!.signAndSendTransaction({
      signerId: accountId,
      receiverId: this.walletManager.contractId,
      callbackUrl,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: method,
            args,
            gas,
            deposit,
          },
        },
      ],
    })

    return Promise.resolve(providers.getTransactionLastResult(outcome as providers.FinalExecutionOutcome) as R)
  }

  // Build Call Multi Method
  private async buildCallMultiMethod<A extends object>(transactionsList: Transaction<A>[], callbackUrl?: string) {
    if (!this.walletManager.walletSelector) {
      await this.walletManager.initNear()
    }

    // Check if wallet is connected
    if (!this.walletManager.walletSelector.isSignedIn()) {
      return Promise.reject({ error: 'No wallet connected' })
    }

    const { accountId } = this.walletManager.accounts[0]

    const transactions: CoreTransaction[] = []

    transactionsList.forEach((transaction) => {
      transactions.push({
        signerId: accountId,
        receiverId: transaction.receiverId || this.walletManager.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: transaction.method,
              args: transaction.args || {},
              gas: transaction.gas || THIRTY_TGAS,
              deposit: transaction.deposit || NO_DEPOSIT,
            },
          },
        ],
      })
    })

    const outcome = await this.walletManager.wallet!.signAndSendTransactions({
      transactions,
      callbackUrl,
    })

    return outcome
  }

  /**
   * [view] Make a read-only call to retrieve information from the network
   * @param method Contract's method name
   * @param {A} props.args - Function parameters
   * @param config Additional configuration (cache)
   * @returns
   */
  async view<A extends {}, R>(method: string, props?: ViewMethodArgs<A>, config?: BuildViewInterfaceConfig) {
    return this.buildViewInterface<R>({ method, args: props?.args || {}, config })
  }

  /**
   * [payable] Call a method that changes the contract's state
   * @param method Contract's method name
   * @param {A} props.args - Function parameters
   * @param {string} props.gas - (optional) gas
   * @param {string} props.deposit - (optional) yoctoⓃ amount
   * @returns
   */
  async call<A extends {}, R>(method: string, props?: ChangeMethodArgs<A>) {
    return this.buildCallInterface<R>({ method, ...props })
  }

  /**
   * [payable] Call multiple methods that changes the contract's state
   * @param {Transaction[]} transactionsList A list of Transaction props. You can use `buildTransaction(...)` to help you out
   * @param callbackUrl A page to take the user to after all the transactions succeeds.
   * @returns
   */
  async callMultiple<A extends object>(transactionsList: Transaction<A>[], callbackUrl?: string) {
    return this.buildCallMultiMethod<A>(transactionsList, callbackUrl)
  }
}

export default ContractManager
