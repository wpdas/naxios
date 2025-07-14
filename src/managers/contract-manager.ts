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
import { pollingAsyncCall, queueCalls } from '../utils'
import { FailoverRpcProvider } from 'near-api-js/lib/providers'

type ResultType = QueryResponseKind & { result: any }

class ContractManager {
  private rpcNodeUrl?: ContractManagerConfig['rpcNodeUrl']
  private fallbackRpcNodesUrls?: ContractManagerConfig['fallbackRpcNodesUrls']
  private walletManager: WalletManager
  private cache?: MemoryCache | StorageCache
  private contractId: string

  constructor({ rpcNodeUrl, fallbackRpcNodesUrls, walletManager, cache, contractId }: ContractManagerConfig) {
    this.rpcNodeUrl = rpcNodeUrl
    this.fallbackRpcNodesUrls = fallbackRpcNodesUrls
    this.walletManager = walletManager
    this.cache = cache
    this.contractId = contractId || walletManager.contractId
  }

  private async checkWallet() {
    if (this.walletManager.status === 'pending' || !this.walletManager.wallet) {
      await this.walletManager.initNear()
    }
  }

  /**
   * Create a key name based on contractId + method + args
   * @param method
   * @param args
   * @returns
   */
  private getCacheKey(method: string, args: Record<string, any>, tag?: string) {
    let keysValues = ''
    Object.keys(args || {}).forEach((key) => {
      keysValues += `:${key}-${args[key]}`
    })

    const key = `naxios::${this.walletManager.network}:${this.contractId}:${method}${keysValues}:${tag || ''}`
    return key
  }

  // Build View Method Interface
  private async buildViewInterface<R>(props: BuildViewInterfaceProps) {
    // Clean up cache: remove all expired items from cache (in memory or local storage)
    if (this.cache) {
      await this.cache.cleanUp()
    }

    const { method = '', args = {}, config } = props
    const cacheKey = this.getCacheKey(method, args, config?.tag)

    // Check if there's cached information, if so, returns it
    // item name is composed of: naxios::testnet:contractAddress:method:arg0-arg0value:arg1-arg1value...
    if (config?.useCache && this.cache) {
      const cachedData = await this.cache.getItem<R>(cacheKey)

      // If cached data is "fetching", wait for it to finish
      if (cachedData === 'fetching') {
        const result = await pollingAsyncCall(
          () => {
            return Promise.resolve(this.cache!.getItem<R>(cacheKey))
          },
          (result) => result !== 'fetching'
        )

        if (result && result !== 'fetching') {
          return result
        }
      }

      // If cached data is available, return it
      if (cachedData) {
        return cachedData
      }

      // If there's no cache, set as fetching
      await this.cache.setItem<string>(cacheKey, 'fetching', config.expirationTime)
    }
    // If there's no cache, go forward...

    // Check if wallet is ready
    if (this.walletManager.status !== 'ready') {
      // If not, wait till this is ready to proceed
      await pollingAsyncCall(
        () => {
          return Promise.resolve(this.walletManager.status)
        },
        (result) => result === 'ready'
      )
    }

    const { network } = this.walletManager.walletSelector.options

    let providersList = [new providers.JsonRpcProvider({ url: this.rpcNodeUrl ?? network.nodeUrl })]
    if (this.fallbackRpcNodesUrls) {
      const fallbackProviders = this.fallbackRpcNodesUrls.map(
        (url) =>
          new providers.JsonRpcProvider(
            { url },
            {
              retries: 3, // Number of retries before giving up on a request
              backoff: 2, // Backoff factor for the retry delay
              wait: 500, // Wait time between retries in milliseconds
            }
          )
      )
      providersList = [...providersList, ...fallbackProviders]
    }

    const provider = new FailoverRpcProvider(providersList)

    const res = (await provider.query({
      request_type: 'call_function',
      account_id: this.contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    })) as ResultType

    const outcome = JSON.parse(Buffer.from(res.result).toString()) as R

    // If cache is available, store data on it
    if (config?.useCache && this.cache) {
      await this.cache.setItem<R>(cacheKey, outcome, config.expirationTime)
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
    let outcome: providers.FinalExecutionOutcome | void
    try {
      outcome = await this.walletManager.wallet!.signAndSendTransaction({
        signerId: accountId,
        receiverId: this.contractId,
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
    } catch (error) {
      console.error('Naxios Internal: Error signing and sending transaction =>', error)
      return Promise.reject(error)
    }

    if (!outcome) {
      console.log('Naxios Internal: No outcome from transaction')
      return Promise.resolve({} as R)
    }

    try {
      return Promise.resolve(providers.getTransactionLastResult(outcome as providers.FinalExecutionOutcome) as R)
    } catch (error) {
      console.error('Naxios Internal: Error getting transaction last result =>', error)
      return Promise.reject(error)
    }
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
        receiverId: transaction.receiverId || this.contractId,
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
    await this.checkWallet()
    if (config?.useQueue) {
      return queueCalls.queue(
        () => this.buildViewInterface<R>({ method, args: props?.args || {}, config }),
        config?.tag
      )
    }
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
    await this.checkWallet()
    return this.buildCallInterface<R>({ method, ...props })
  }

  /**
   * [payable] Call multiple methods that changes the contract's state
   * @param {Transaction[]} transactionsList A list of Transaction props. You can use `buildTransaction(...)` to help you out
   * @param callbackUrl A page to take the user to after all the transactions succeeds.
   * @returns
   */
  async callMultiple<A extends object>(transactionsList: Transaction<A>[], callbackUrl?: string) {
    await this.checkWallet()
    return this.buildCallMultiMethod<A>(transactionsList, callbackUrl)
  }
}

export default ContractManager
