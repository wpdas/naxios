import { useEffect, useState } from 'react'
import naxios from '../naxios'
import WalletManager from '../managers/wallet-manager'
import { Config } from '../managers/types'

/**
 * NEAR Wallet API Hook
 * @param config
 * @returns
 */
const useWallet = (config: Config) => {
  const [ready, setReady] = useState(false)
  const [walletApi, setWalletApi] = useState<WalletManager>()

  useEffect(() => {
    const walletApi = new naxios(config).walletApi(() => {
      setReady(true)
    })

    setWalletApi(walletApi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    walletApi,
    ready,
  }
}

export default useWallet
