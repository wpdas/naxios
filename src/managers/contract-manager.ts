import { providers } from 'near-api-js'
import { NO_DEPOSIT, THIRTY_TGAS } from './constants'
import { QueryResponseKind } from 'near-api-js/lib/providers/provider'
import WalletManager from './wallet-manager'
import { ChangeMethodArgs, ViewMethodArgs } from './types'

type ResultType = QueryResponseKind & { result: any }

class ContractManager {
  private walletManager: WalletManager

  constructor(config: { walletManager: WalletManager; onInit?: () => void }) {
    this.walletManager = config.walletManager

    this.init().then(() => {
      if (config.onInit) {
        config.onInit()
      }
    })
  }

  private async init() {
    if (!this.walletManager.wallet) {
      await this.walletManager.initNear()
    }
  }

  // Build View Method Interface
  private async buildViewInterface<R>({ method = '', args = {} }) {
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

    return JSON.parse(Buffer.from(res.result).toString()) as R
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

  /**
   * [view] Make a read-only call to retrieve information from the network
   * @param method Contract's method name
   * @param {A} props.args - Function parameters
   * @returns
   */
  async view<A extends {}, R>(method: string, props?: ViewMethodArgs<A>) {
    return this.buildViewInterface<R>({ method, ...props })
  }

  /**
   * [payable] Call a method that changes the contract's state
   * @param method Contract's method name
   * @param {A} props.args - Function parameters
   * @param {string} props.gas - (optional) gas
   * @param {string} props.deposit - (optional) deposit
   * @returns
   */
  async call<A extends {}, R>(method: string, props?: ChangeMethodArgs<A>) {
    return this.buildCallInterface<R>({ method, ...props })
  }
}

export default ContractManager
